import AppError from "@/shared/errors/AppError";
import prisma from "@/infra/database/database.config";
import { Server as SocketIOServer } from "socket.io";
import {
  COMPANION_TASK_KIND,
  GOAL_SUCCESS_REASON,
  GOAL_SUCCESS_STAGE,
  GOAL_SUCCESS_STATUS,
  GOAL_STEP_SUCCESS_STATUS,
  CHAT_STATUS,
} from "@prisma/client";
import { OrderRepository } from "./order.repository";
import { GoalService } from "../goal/goal.service";
import { ShipmentService } from "../shipment/shipment.service";
import { ShipmentRepository } from "../shipment/shipment.repository";
import {
  buildGoalSuccessInterventions,
  buildGoalSuccessSummary,
  buildGoalTemplateMatches,
} from "./goalSuccess.helpers";
import {
  buildOrderTrackingResponse,
  getEffectiveTrackingStatus,
} from "./orderTracking.helpers";

const GOAL_STAGE_META: Record<
  GOAL_SUCCESS_STAGE,
  { label: string; description: string; daysAfterOrder: number }
> = {
  DELIVERY: {
    label: "After delivery",
    description: "Check whether the order arrived complete and ready to use.",
    daysAfterOrder: 2,
  },
  SETUP: {
    label: "After setup",
    description: "Capture whether the setup or first real use matched the goal.",
    daysAfterOrder: 7,
  },
  FOLLOW_UP: {
    label: "2-4 weeks later",
    description: "Reflect on whether the order kept delivering the intended outcome.",
    daysAfterOrder: 21,
  },
};

export class OrderService {
  private goalService = new GoalService();
  private shipmentService = new ShipmentService(new ShipmentRepository());
  private readonly goalSuccessReasonLabels: Record<GOAL_SUCCESS_REASON, string> = {
    MISSING_ITEM: "Missing item or step",
    FIT: "Fit issue",
    QUALITY: "Quality mismatch",
    SETUP: "Setup was harder than expected",
    DELIVERY: "Delivery problem",
    BUDGET: "Budget regret",
    STYLE: "Style or preference mismatch",
    WRONG_MATCH: "The recommendation was wrong",
    OTHER: "Other",
  };
  private readonly goalSuccessStatusLabels: Record<GOAL_SUCCESS_STATUS, string> = {
    PENDING: "Pending",
    SUCCESS: "Goal achieved",
    PARTIAL: "Partially achieved",
    FAILED: "Goal not achieved",
    SKIPPED: "Saved for later",
  };
  private readonly goalStageLabels: Record<GOAL_SUCCESS_STAGE, string> = {
    DELIVERY: GOAL_STAGE_META.DELIVERY.label,
    SETUP: GOAL_STAGE_META.SETUP.label,
    FOLLOW_UP: GOAL_STAGE_META.FOLLOW_UP.label,
  };
  private readonly goalStepStatusLabels: Record<GOAL_STEP_SUCCESS_STATUS, string> = {
    PENDING: "Pending",
    ACHIEVED: "Achieved",
    PARTIAL: "Partially achieved",
    MISSED: "Still missing",
    NOT_APPLICABLE: "Not applicable",
  };

  constructor(
    private orderRepository: OrderRepository,
    private io?: SocketIOServer
  ) {}

  private emitOrderEvent(userId: string, payload: Record<string, unknown>) {
    this.io?.to(`user:${userId}:orders`).emit("orderUpdated", payload);
  }

  private getOrderedProducts(order: any) {
    const productMap = new Map<string, any>();

    for (const item of order.orderItems || []) {
      const product = item.variant?.product;
      if (product?.id && !productMap.has(product.id)) {
        productMap.set(product.id, product);
      }
    }

    return Array.from(productMap.values());
  }

  private getGoalSignalItems(order: any) {
    return (order.orderItems || []).map((item: any) => ({
      productName: item.variant?.product?.name || "",
      description: item.variant?.product?.description || "",
      categoryName: item.variant?.product?.category?.name || "",
    }));
  }

  private async getGoalTemplateCatalog() {
    return this.goalService.listGoals();
  }

  private async getRecommendedGoalMatches(order: any) {
    const goalTemplates = await this.getGoalTemplateCatalog();
    return buildGoalTemplateMatches(this.getGoalSignalItems(order), goalTemplates);
  }

  private formatGoalTemplateSummary(goalTemplate: any) {
    if (!goalTemplate) {
      return null;
    }

    return {
      id: goalTemplate.id,
      slug: goalTemplate.slug,
      title: goalTemplate.title,
      description: goalTemplate.description,
      audience: goalTemplate.audience,
      suggestedBudget: goalTemplate.suggestedBudget,
      steps: (goalTemplate.steps || []).map((step: any) => ({
        key: step.key || step.stepKey,
        label: step.label,
        description: step.description,
      })),
    };
  }

  private deriveOverallGoalStatus(stages: Array<{ status: GOAL_SUCCESS_STATUS }>) {
    const statuses = stages
      .map((stage) => stage.status)
      .filter((status) => status !== GOAL_SUCCESS_STATUS.SKIPPED);

    if (!statuses.length || statuses.every((status) => status === GOAL_SUCCESS_STATUS.PENDING)) {
      return GOAL_SUCCESS_STATUS.PENDING;
    }

    if (statuses.some((status) => status === GOAL_SUCCESS_STATUS.FAILED)) {
      return GOAL_SUCCESS_STATUS.FAILED;
    }

    if (statuses.some((status) => status === GOAL_SUCCESS_STATUS.PARTIAL)) {
      return GOAL_SUCCESS_STATUS.PARTIAL;
    }

    if (statuses.some((status) => status === GOAL_SUCCESS_STATUS.SUCCESS)) {
      const completedCount = statuses.filter(
        (status) => status === GOAL_SUCCESS_STATUS.SUCCESS
      ).length;

      return completedCount === statuses.length
        ? GOAL_SUCCESS_STATUS.SUCCESS
        : GOAL_SUCCESS_STATUS.PARTIAL;
    }

    return GOAL_SUCCESS_STATUS.PENDING;
  }

  private deriveStageStatus(
    steps: Array<{ status: GOAL_STEP_SUCCESS_STATUS }>,
    explicitStatus?: GOAL_SUCCESS_STATUS | null
  ) {
    if (explicitStatus) {
      return explicitStatus;
    }

    const statuses = steps
      .map((step) => step.status)
      .filter((status) => status !== GOAL_STEP_SUCCESS_STATUS.NOT_APPLICABLE);

    if (!statuses.length || statuses.every((status) => status === GOAL_STEP_SUCCESS_STATUS.PENDING)) {
      return GOAL_SUCCESS_STATUS.PENDING;
    }

    if (statuses.some((status) => status === GOAL_STEP_SUCCESS_STATUS.MISSED)) {
      return GOAL_SUCCESS_STATUS.FAILED;
    }

    if (statuses.some((status) => status === GOAL_STEP_SUCCESS_STATUS.PARTIAL)) {
      return GOAL_SUCCESS_STATUS.PARTIAL;
    }

    if (statuses.every((status) => status === GOAL_STEP_SUCCESS_STATUS.ACHIEVED)) {
      return GOAL_SUCCESS_STATUS.SUCCESS;
    }

    if (statuses.some((status) => status === GOAL_STEP_SUCCESS_STATUS.ACHIEVED)) {
      return GOAL_SUCCESS_STATUS.PARTIAL;
    }

    return GOAL_SUCCESS_STATUS.PENDING;
  }

  private buildGoalStageBlueprints(order: any, goalTemplate: any, checkin?: any) {
    const goalSteps = (goalTemplate?.steps || []).map((step: any) => ({
      key: step.key || step.stepKey,
      label: step.label,
      description: step.description,
    }));

    return (Object.keys(GOAL_STAGE_META) as GOAL_SUCCESS_STAGE[]).map((stageKey) => {
      const stageMeta = GOAL_STAGE_META[stageKey];
      const existingStage = (checkin?.stages || []).find(
        (stage: any) => stage.stage === stageKey
      );
      const dueAt = new Date(order.orderDate);
      dueAt.setDate(dueAt.getDate() + stageMeta.daysAfterOrder);

      return {
        stage: stageKey,
        label: stageMeta.label,
        description: stageMeta.description,
        dueAt,
        status: existingStage?.status || GOAL_SUCCESS_STATUS.PENDING,
        satisfactionScore: existingStage?.satisfactionScore || null,
        primaryReason: existingStage?.primaryReason || null,
        notes: existingStage?.notes || null,
        submittedAt: existingStage?.submittedAt || null,
        steps: goalSteps.map((step: any) => {
          const existingStep = (existingStage?.steps || []).find(
            (stageStep: any) => stageStep.stepKey === step.key
          );

          return {
            stepKey: step.key,
            stepLabel: existingStep?.stepLabel || step.label,
            description: step.description,
            status: existingStep?.status || GOAL_STEP_SUCCESS_STATUS.PENDING,
            notes: existingStep?.notes || null,
          };
        }),
      };
    });
  }

  private collectRecoverySteps(stages: any[], selectedGoalMatch: any) {
    const recoveryStepMap = new Map<string, { key: string; label: string; description: string }>();

    for (const stage of stages || []) {
      for (const step of stage.steps || []) {
        if (
          step.status === GOAL_STEP_SUCCESS_STATUS.MISSED ||
          step.status === GOAL_STEP_SUCCESS_STATUS.PARTIAL
        ) {
          recoveryStepMap.set(step.stepKey, {
            key: step.stepKey,
            label: step.stepLabel,
            description: step.description || "",
          });
        }
      }
    }

    if (recoveryStepMap.size === 0) {
      for (const step of selectedGoalMatch?.missingSteps || []) {
        recoveryStepMap.set(step.key, step);
      }
    }

    return Array.from(recoveryStepMap.values());
  }

  private buildGoalOutcomeInsights(stages: any[]) {
    return stages.map((stage) => ({
      stage: stage.stage,
      label: stage.label,
      status: stage.status,
      unresolvedSteps: (stage.steps || [])
        .filter(
          (step: any) =>
            step.status === GOAL_STEP_SUCCESS_STATUS.MISSED ||
            step.status === GOAL_STEP_SUCCESS_STATUS.PARTIAL
        )
        .map((step: any) => ({
          key: step.stepKey,
          label: step.stepLabel,
          status: step.status,
          statusLabel: this.goalStepStatusLabels[step.status],
        })),
    }));
  }

  private buildOrderItemsSummary(order: any) {
    const items = (order.orderItems || [])
      .slice(0, 4)
      .map((item: any) => {
        const productName =
          item.variant?.product?.name || item.variant?.sku || "Item";
        return `${productName} x${item.quantity}`;
      });

    return items.length ? items.join(", ") : "No order items recorded";
  }

  private buildPublicTrackingResponse(order: any) {
    const tracking = buildOrderTrackingResponse(order);
    const status = getEffectiveTrackingStatus(order);

    return {
      id: order.id,
      orderDate: order.orderDate,
      amount: order.amount,
      status,
      customer: {
        name: order.user?.name || "Customer",
        email: order.user?.email || "",
      },
      tracking,
      shipment: order.shipment
        ? {
            carrier: order.shipment.carrier,
            trackingNumber: order.shipment.trackingNumber,
            shippedDate: order.shipment.shippedDate,
            deliveryDate: order.shipment.deliveryDate,
          }
        : null,
      address: order.address
        ? {
            street: order.address.street,
            city: order.address.city,
            state: order.address.state,
            country: order.address.country,
            zip: order.address.zip,
          }
        : null,
      items: (order.orderItems || []).map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        sku: item.variant?.sku || null,
        productName: item.variant?.product?.name || "Item",
        categoryName: item.variant?.product?.category?.name || null,
      })),
    };
  }

  private buildGoalSupportStarterMessage({
    order,
    goalTemplate,
    status,
    primaryReason,
    notes,
  }: {
    order: any;
    goalTemplate?: { title: string } | null;
    status?: GOAL_SUCCESS_STATUS;
    primaryReason?: GOAL_SUCCESS_REASON;
    notes?: string | null;
  }) {
    const messageParts = [
      `I need help with order ${order.id}.`,
      goalTemplate?.title ? `Goal: ${goalTemplate.title}.` : null,
      status ? `Outcome status: ${this.goalSuccessStatusLabels[status]}.` : null,
      primaryReason
        ? `Reason: ${this.goalSuccessReasonLabels[primaryReason]}.`
        : null,
      notes?.trim() ? `Customer note: ${notes.trim()}.` : null,
      `Items: ${this.buildOrderItemsSummary(order)}.`,
    ];

    return messageParts.filter(Boolean).join(" ");
  }

  private async getGoalSuccessCheckin(orderId: string) {
    return prisma.goalSuccessCheckin.findUnique({
      where: { orderId },
      include: {
        goalTemplate: {
          include: {
            steps: {
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        interventions: {
          orderBy: { sortOrder: "asc" },
        },
        stages: {
          include: {
            steps: {
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }

  private async buildGoalSuccessResponse(order: any, checkin?: any) {
    const [goalTemplates, recommendedGoals] = await Promise.all([
      this.getGoalTemplateCatalog(),
      this.getRecommendedGoalMatches(order),
    ]);
    const selectedGoalTemplate =
      this.formatGoalTemplateSummary(checkin?.goalTemplate) ||
      this.formatGoalTemplateSummary(order.goalTemplate) ||
      this.formatGoalTemplateSummary(
        goalTemplates.find((goal) => goal.id === recommendedGoals[0]?.id)
      );
    const selectedGoalMatch =
      recommendedGoals.find((goal) => goal.id === selectedGoalTemplate?.id) ||
      recommendedGoals[0] ||
      null;
    const stages = this.buildGoalStageBlueprints(
      order,
      selectedGoalTemplate,
      checkin
    );
    const derivedStatus =
      checkin?.status || this.deriveOverallGoalStatus(stages);
    const recoverySteps = this.collectRecoverySteps(stages, selectedGoalMatch);

    return {
      checkin: checkin
        ? {
            id: checkin.id,
            goalTemplateId: checkin.goalTemplateId,
            status: derivedStatus,
            satisfactionScore: checkin.satisfactionScore,
            primaryReason: checkin.primaryReason,
            notes: checkin.notes,
            submittedAt: checkin.submittedAt,
          }
        : {
            id: null,
            goalTemplateId: selectedGoalTemplate?.id || null,
            status: derivedStatus,
            satisfactionScore: null,
            primaryReason: null,
            notes: null,
            submittedAt: null,
          },
      selectedGoalTemplate,
      selectedBundle: order.goalBundle
        ? {
            id: order.goalBundle.id,
            name: order.goalBundle.name,
            budget: order.goalBundle.budget,
            total: order.goalBundle.total,
            remainingBudget: order.goalBundle.remainingBudget,
            brief: order.goalBundle.brief || {},
          }
        : null,
      recommendedGoals: recommendedGoals.map((goal) => ({
        id: goal.id,
        slug: goal.slug,
        title: goal.title,
        description: goal.description,
        score: goal.score,
        whyItFits: goal.whyItFits,
        matchedSteps: goal.matchedSteps,
        missingSteps: goal.missingSteps,
      })),
      stages: stages.map((stage) => ({
        stage: stage.stage,
        label: stage.label,
        description: stage.description,
        dueAt: stage.dueAt,
        status: stage.status,
        statusLabel: this.goalSuccessStatusLabels[stage.status],
        satisfactionScore: stage.satisfactionScore,
        primaryReason: stage.primaryReason,
        notes: stage.notes,
        submittedAt: stage.submittedAt,
        steps: stage.steps.map((step: any) => ({
          stepKey: step.stepKey,
          stepLabel: step.stepLabel,
          description: step.description,
          status: step.status,
          statusLabel: this.goalStepStatusLabels[step.status],
          notes: step.notes,
        })),
      })),
      outcomeInsights: this.buildGoalOutcomeInsights(stages),
      interventions: (checkin?.interventions || []).map((intervention: any) => ({
        id: intervention.id,
        type: intervention.type,
        title: intervention.title,
        description: intervention.description,
        ctaLabel: intervention.ctaLabel,
        ctaHref: intervention.ctaHref,
        sortOrder: intervention.sortOrder,
      })),
      summary: buildGoalSuccessSummary({
        status: derivedStatus,
        selectedGoalTitle: selectedGoalTemplate?.title,
        recommendedGoals,
      }),
      recoverySteps,
    };
  }

  private buildDefaultCareGuides(product: any) {
    const categoryName = product.category?.name || "general products";

    return [
      {
        title: `Start with a quick ${product.name} setup check`,
        content:
          "Inspect the item when it arrives and confirm every accessory or included part is present before disposal of the packaging.",
        sortOrder: 1,
      },
      {
        title: `Care routine for ${product.name}`,
        content: `Keep ${product.name} clean, dry, and stored according to its intended use. For ${categoryName.toLowerCase()}, consistent handling and storage usually extends product life.`,
        sortOrder: 2,
      },
    ];
  }

  private buildDefaultWarranty(product: any) {
    return {
      title: `${product.name} coverage`,
      description:
        "Keep your order confirmation, shipping updates, and product packaging in case you need replacement, return, or warranty help.",
      provider: "Store Support",
      durationDays: 180,
      claimSteps: [
        "Keep the order confirmation handy.",
        "Take photos if something arrives damaged.",
        "Contact support with your order ID and issue details.",
      ],
    };
  }

  private async ensureProductSupportContent(order: any) {
    const products = this.getOrderedProducts(order);

    for (const product of products) {
      const careGuideCount = await prisma.productCareGuide.count({
        where: { productId: product.id },
      });

      if (careGuideCount === 0) {
        await prisma.productCareGuide.createMany({
          data: this.buildDefaultCareGuides(product).map((guide) => ({
            productId: product.id,
            title: guide.title,
            content: guide.content,
            sortOrder: guide.sortOrder,
          })),
        });
      }

      const warrantyCount = await prisma.warrantyInfo.count({
        where: { productId: product.id },
      });

      if (warrantyCount === 0) {
        const warranty = this.buildDefaultWarranty(product);
        await prisma.warrantyInfo.create({
          data: {
            productId: product.id,
            title: warranty.title,
            description: warranty.description,
            provider: warranty.provider,
            durationDays: warranty.durationDays,
            claimSteps: warranty.claimSteps,
          },
        });
      }
    }
  }

  private async ensureOrderCompanionRecord(order: any) {
    await this.ensureProductSupportContent(order);

    let companion = await prisma.orderCompanion.findUnique({
      where: { orderId: order.id },
      include: {
        tasks: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (companion) {
      return companion;
    }

    const products = this.getOrderedProducts(order);
    const firstProductName = products[0]?.name || "your order";
    const totalUnits = (order.orderItems || []).reduce(
      (count: number, item: any) => count + item.quantity,
      0
    );

    companion = await prisma.orderCompanion.create({
      data: {
        orderId: order.id,
        headline: `Everything you need to get the most out of ${firstProductName}.`,
        supportLabel: "Need help after delivery?",
        supportDescription:
          "If setup feels off, something arrives damaged, or you need a replacement path, support can pick up from this order context.",
        reorderRecommendation:
          totalUnits > 1
            ? "Set a reminder before you run low on the items you use most often."
            : "Set a reminder once this becomes part of your regular routine.",
        reorderSuggestedDays: Math.min(Math.max(totalUnits * 14, 21), 90),
        tasks: {
          create: [
            {
              kind: COMPANION_TASK_KIND.SETUP,
              title: "Inspect and set up",
              description:
                "Open the package promptly, verify the contents, and start with the main item before layering in the rest of the order.",
              sortOrder: 1,
            },
            {
              kind: COMPANION_TASK_KIND.CARE,
              title: "Follow the care routine",
              description:
                "Use the care guidance below to keep the product clean, protected, and ready for regular use.",
              sortOrder: 2,
            },
            {
              kind: COMPANION_TASK_KIND.WARRANTY,
              title: "Keep proof of purchase",
              description:
                "Hang on to the order confirmation and delivery details in case you need a replacement, warranty check, or return review.",
              sortOrder: 3,
            },
            {
              kind: COMPANION_TASK_KIND.SUPPORT,
              title: "Escalate issues quickly",
              description:
                "If anything feels wrong, contact support while you still have the packaging and photos available.",
              sortOrder: 4,
            },
          ],
        },
      },
      include: {
        tasks: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return companion;
  }

  private async buildCompanionResponse(order: any) {
    const companionRecord = await this.ensureOrderCompanionRecord(order);
    const products = this.getOrderedProducts(order);
    const productIds = products.map((product) => product.id);

    const [careGuides, warranties] = await Promise.all([
      prisma.productCareGuide.findMany({
        where: { productId: { in: productIds } },
        include: {
          product: {
            include: { category: true },
          },
        },
        orderBy: [{ productId: "asc" }, { sortOrder: "asc" }],
      }),
      prisma.warrantyInfo.findMany({
        where: { productId: { in: productIds } },
        include: {
          product: true,
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const groupedCareTips = careGuides.map((guide) => ({
      id: guide.id,
      title: guide.title,
      description: guide.content,
      productName: guide.product.name,
    }));

    const primaryWarranty = warranties[0] || null;

    return {
      id: companionRecord.id,
      headline: companionRecord.headline,
      tasks: companionRecord.tasks.map((task) => ({
        id: task.id,
        kind: task.kind,
        title: task.title,
        description: task.description,
        sortOrder: task.sortOrder,
      })),
      setupTips: companionRecord.tasks
        .filter((task) => task.kind === COMPANION_TASK_KIND.SETUP)
        .map((task) => task.description),
      careTips: groupedCareTips.map((guide) => guide.description),
      careGuides: groupedCareTips,
      warranty: primaryWarranty
        ? {
            id: primaryWarranty.id,
            title: primaryWarranty.title,
            description: primaryWarranty.description,
            provider: primaryWarranty.provider,
            durationDays: primaryWarranty.durationDays,
            claimSteps: primaryWarranty.claimSteps,
            productName: primaryWarranty.product.name,
          }
        : null,
      warranties: warranties.map((warranty) => ({
        id: warranty.id,
        title: warranty.title,
        description: warranty.description,
        provider: warranty.provider,
        durationDays: warranty.durationDays,
        claimSteps: warranty.claimSteps,
        productName: warranty.product.name,
      })),
      reorder: {
        recommendation: companionRecord.reorderRecommendation,
        suggestedDays: companionRecord.reorderSuggestedDays,
      },
      support: {
        label: companionRecord.supportLabel,
        description: companionRecord.supportDescription,
      },
    };
  }

  async getAllOrders() {
    const orders = await this.orderRepository.findAllOrders();
    if (!orders || orders.length === 0) {
      throw new AppError(404, "No orders found");
    }
    return orders.map((order) => ({
      ...order,
      status: getEffectiveTrackingStatus(order),
      tracking: buildOrderTrackingResponse(order),
    }));
  }

  async getUserOrders(userId: string) {
    const orders = await this.orderRepository.findOrdersByUserId(userId);
    return (orders ?? []).map((order) => ({
      ...order,
      status: getEffectiveTrackingStatus(order),
      tracking: buildOrderTrackingResponse(order),
    }));
  }

  async getOrderDetails(orderId: string, userId: string) {
    const order = await this.orderRepository.findOrderById(orderId);
    if (!order) {
      throw new AppError(404, "Order not found");
    }
    if (order.userId !== userId) {
      throw new AppError(403, "You are not authorized to view this order");
    }

    const trackingSync = await this.shipmentService.syncTrackingForOrder(orderId, {
      force: false,
      throwOnProviderFailure: false,
    });
    const trackedOrder = trackingSync.order || order;

    return {
      ...trackedOrder,
      status: getEffectiveTrackingStatus(trackedOrder),
      tracking: buildOrderTrackingResponse(trackedOrder),
      companion: await this.buildCompanionResponse(trackedOrder),
    };
  }

  async lookupOrderTracking(orderId: string, email: string) {
    if (!orderId?.trim()) {
      throw new AppError(400, "Order ID is required");
    }

    if (!email?.trim()) {
      throw new AppError(400, "Email is required");
    }

    const order = await this.orderRepository.findOrderForLookup(
      orderId.trim(),
      email.trim()
    );

    if (!order) {
      throw new AppError(
        404,
        "We could not find an order with that order ID and email."
      );
    }

    const trackingSync = await this.shipmentService.syncTrackingForOrder(order.id, {
      force: false,
      throwOnProviderFailure: false,
    });

    return this.buildPublicTrackingResponse(trackingSync.order || order);
  }

  async getOrderCompanion(orderId: string, userId: string) {
    const order = await this.orderRepository.findOrderById(orderId);

    if (!order) {
      throw new AppError(404, "Order not found");
    }

    if (order.userId !== userId) {
      throw new AppError(403, "You are not authorized to view this order");
    }

    return this.buildCompanionResponse(order);
  }

  async getOrderGoalSuccess(orderId: string, userId: string) {
    const order = await this.orderRepository.findOrderById(orderId);

    if (!order) {
      throw new AppError(404, "Order not found");
    }

    if (order.userId !== userId) {
      throw new AppError(403, "You are not authorized to view this order");
    }

    const checkin = await this.getGoalSuccessCheckin(orderId);
    return this.buildGoalSuccessResponse(order, checkin);
  }

  async submitOrderGoalSuccess(
    orderId: string,
    userId: string,
    payload: {
      goalTemplateId?: string;
      status?: GOAL_SUCCESS_STATUS;
      satisfactionScore?: number;
      primaryReason?: GOAL_SUCCESS_REASON;
      notes?: string;
      stages?: Array<{
        stage: GOAL_SUCCESS_STAGE;
        status?: GOAL_SUCCESS_STATUS;
        satisfactionScore?: number;
        primaryReason?: GOAL_SUCCESS_REASON;
        notes?: string;
        steps?: Array<{
          stepKey: string;
          stepLabel?: string;
          status?: GOAL_STEP_SUCCESS_STATUS;
          notes?: string;
        }>;
      }>;
    }
  ) {
    const order = await this.orderRepository.findOrderById(orderId);

    if (!order) {
      throw new AppError(404, "Order not found");
    }

    if (order.userId !== userId) {
      throw new AppError(403, "You are not authorized to update this order");
    }

    if (
      payload.satisfactionScore !== undefined &&
      (payload.satisfactionScore < 1 || payload.satisfactionScore > 5)
    ) {
      throw new AppError(400, "Satisfaction score must be between 1 and 5");
    }

    const [existingCheckin, goalTemplates, recommendedGoals] = await Promise.all([
      this.getGoalSuccessCheckin(orderId),
      this.getGoalTemplateCatalog(),
      this.getRecommendedGoalMatches(order),
    ]);

    const selectedGoalTemplate =
      goalTemplates.find((goal) => goal.id === payload.goalTemplateId) ||
      goalTemplates.find((goal) => goal.id === order.goalTemplateId) ||
      goalTemplates.find((goal) => goal.id === existingCheckin?.goalTemplateId) ||
      goalTemplates.find((goal) => goal.id === recommendedGoals[0]?.id) ||
      null;

    const selectedGoalMatch =
      recommendedGoals.find((goal) => goal.id === selectedGoalTemplate?.id) || null;

    const baseStages = this.buildGoalStageBlueprints(
      order,
      selectedGoalTemplate,
      existingCheckin
    );

    const normalizedStages = baseStages.map((stage) => {
      const incomingStage = payload.stages?.find(
        (entry) => entry.stage === stage.stage
      );
      const incomingStepMap = new Map(
        (incomingStage?.steps || []).map((step) => [step.stepKey, step])
      );
      const steps = (stage.steps || []).map((step: any) => {
        const incomingStep = incomingStepMap.get(step.stepKey);
        return {
          stepKey: step.stepKey,
          stepLabel: incomingStep?.stepLabel || step.stepLabel,
          description: step.description,
          status:
            incomingStep?.status ||
            step.status ||
            GOAL_STEP_SUCCESS_STATUS.PENDING,
          notes: incomingStep?.notes?.trim() || step.notes || null,
        };
      });

      const derivedStageStatus = this.deriveStageStatus(
        steps,
        incomingStage?.status || stage.status
      );
      const effectiveStagePrimaryReason =
        incomingStage?.primaryReason !== undefined
          ? incomingStage.primaryReason
          : stage.primaryReason;

      if (
        incomingStage?.satisfactionScore !== undefined &&
        (incomingStage.satisfactionScore < 1 || incomingStage.satisfactionScore > 5)
      ) {
        throw new AppError(400, "Stage satisfaction score must be between 1 and 5");
      }

      if (
        (derivedStageStatus === GOAL_SUCCESS_STATUS.PARTIAL ||
          derivedStageStatus === GOAL_SUCCESS_STATUS.FAILED) &&
        !effectiveStagePrimaryReason
      ) {
        throw new AppError(
          400,
          `A primary reason is required for ${this.goalStageLabels[stage.stage].toLowerCase()} when the outcome is partial or failed`
        );
      }

      return {
        ...stage,
        status: derivedStageStatus,
        satisfactionScore:
          incomingStage?.satisfactionScore !== undefined
            ? incomingStage.satisfactionScore
            : stage.satisfactionScore,
        primaryReason: effectiveStagePrimaryReason,
        notes:
          incomingStage?.notes !== undefined
            ? incomingStage.notes?.trim() || null
            : stage.notes,
        submittedAt:
          incomingStage ||
          steps.some(
            (step) => step.status !== GOAL_STEP_SUCCESS_STATUS.PENDING || !!step.notes
          )
            ? new Date()
            : stage.submittedAt,
        steps,
      };
    });

    const overallStatus =
      payload.status || this.deriveOverallGoalStatus(normalizedStages);
    const overallPrimaryReason =
      payload.primaryReason !== undefined
        ? payload.primaryReason
        : existingCheckin?.primaryReason;

    if (
      (overallStatus === GOAL_SUCCESS_STATUS.PARTIAL ||
        overallStatus === GOAL_SUCCESS_STATUS.FAILED) &&
      !overallPrimaryReason
    ) {
      throw new AppError(400, "A primary reason is required for partial or failed outcomes");
    }

    const overallSatisfactionScore =
      payload.satisfactionScore !== undefined
        ? payload.satisfactionScore
        : existingCheckin?.satisfactionScore !== undefined
          ? existingCheckin.satisfactionScore
        : normalizedStages
            .map((stage) => stage.satisfactionScore)
            .find((score) => typeof score === "number") || undefined;
    const overallNotes =
      payload.notes !== undefined
        ? payload.notes?.trim() || null
        : existingCheckin?.notes || null;
    const recoverySteps = this.collectRecoverySteps(
      normalizedStages,
      selectedGoalMatch
    );

    const interventions = buildGoalSuccessInterventions({
      orderId,
      status: overallStatus,
      primaryReason: overallPrimaryReason,
      goalTemplate: selectedGoalTemplate
        ? {
            slug: selectedGoalTemplate.slug,
            title: selectedGoalTemplate.title,
          }
        : null,
      missingSteps: recoverySteps,
    });

    const checkin = await prisma.$transaction(async (tx) => {
      const upserted = await tx.goalSuccessCheckin.upsert({
        where: { orderId },
        create: {
          orderId,
          goalTemplateId: selectedGoalTemplate?.id || null,
          status: overallStatus,
          satisfactionScore: overallSatisfactionScore,
          primaryReason: overallPrimaryReason,
          notes: overallNotes,
          submittedAt: new Date(),
          interventions: {
            create: interventions,
          },
        },
        update: {
          goalTemplateId: selectedGoalTemplate?.id || null,
          status: overallStatus,
          satisfactionScore: overallSatisfactionScore,
          primaryReason: overallPrimaryReason,
          notes: overallNotes,
          submittedAt: new Date(),
          interventions: {
            deleteMany: {},
            create: interventions,
          },
        },
      });

      for (const stage of normalizedStages) {
        await tx.goalSuccessStageCheckin.upsert({
          where: {
            checkinId_stage: {
              checkinId: upserted.id,
              stage: stage.stage,
            },
          },
          create: {
            checkinId: upserted.id,
            stage: stage.stage,
            status: stage.status,
            satisfactionScore: stage.satisfactionScore,
            primaryReason: stage.primaryReason,
            notes: stage.notes,
            submittedAt: stage.submittedAt,
            steps: {
              create: stage.steps.map((step) => ({
                stepKey: step.stepKey,
                stepLabel: step.stepLabel,
                status: step.status,
                notes: step.notes,
              })),
            },
          },
          update: {
            status: stage.status,
            satisfactionScore: stage.satisfactionScore,
            primaryReason: stage.primaryReason,
            notes: stage.notes,
            submittedAt: stage.submittedAt,
            steps: {
              deleteMany: {},
              create: stage.steps.map((step) => ({
                stepKey: step.stepKey,
                stepLabel: step.stepLabel,
                status: step.status,
                notes: step.notes,
              })),
            },
          },
        });
      }

      return tx.goalSuccessCheckin.findUnique({
        where: { orderId },
        include: {
          goalTemplate: {
            include: {
              steps: {
                orderBy: { sortOrder: "asc" },
              },
            },
          },
          interventions: {
            orderBy: { sortOrder: "asc" },
          },
          stages: {
            include: {
              steps: {
                orderBy: { createdAt: "asc" },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });
    });

    return this.buildGoalSuccessResponse(order, checkin);
  }

  async createSupportHandoff(
    orderId: string,
    userId: string,
    payload: {
      goalTemplateId?: string;
      status?: GOAL_SUCCESS_STATUS;
      primaryReason?: GOAL_SUCCESS_REASON;
      notes?: string;
    }
  ) {
    const order = await this.orderRepository.findOrderById(orderId);

    if (!order) {
      throw new AppError(404, "Order not found");
    }

    if (order.userId !== userId) {
      throw new AppError(403, "You are not authorized to update this order");
    }

    if (
      payload.status &&
      !Object.values(GOAL_SUCCESS_STATUS).includes(payload.status)
    ) {
      throw new AppError(400, "Invalid goal success status");
    }

    if (
      payload.primaryReason &&
      !Object.values(GOAL_SUCCESS_REASON).includes(payload.primaryReason)
    ) {
      throw new AppError(400, "Invalid goal success reason");
    }

    const existingCheckin = await this.getGoalSuccessCheckin(orderId);
    const [goalTemplates, recommendedGoals] = await Promise.all([
      this.getGoalTemplateCatalog(),
      this.getRecommendedGoalMatches(order),
    ]);

    const selectedGoalTemplate =
      goalTemplates.find((goal) => goal.id === payload.goalTemplateId) ||
      goalTemplates.find((goal) => goal.id === existingCheckin?.goalTemplateId) ||
      goalTemplates.find((goal) => goal.id === recommendedGoals[0]?.id) ||
      null;

    const effectiveStatus = payload.status || existingCheckin?.status || undefined;
    const effectivePrimaryReason =
      payload.primaryReason || existingCheckin?.primaryReason || undefined;
    const effectiveNotes = payload.notes?.trim() || existingCheckin?.notes || null;

    let chat = await prisma.chat.findFirst({
      where: {
        userId,
        orderId,
        status: CHAT_STATUS.OPEN,
      },
      include: {
        user: true,
        order: true,
        messages: { include: { sender: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          userId,
          orderId,
          status: CHAT_STATUS.OPEN,
        },
        include: {
          user: true,
          order: true,
          messages: { include: { sender: true } },
        },
      });

      this.io?.to("admin").emit("chatCreated", chat);
    }

    const starterMessage = this.buildGoalSupportStarterMessage({
      order,
      goalTemplate: selectedGoalTemplate
        ? { title: selectedGoalTemplate.title }
        : null,
      status: effectiveStatus,
      primaryReason: effectivePrimaryReason,
      notes: effectiveNotes,
    });

    const existingStarterMessage = await prisma.chatMessage.findFirst({
      where: {
        chatId: chat.id,
        senderId: userId,
        content: starterMessage,
      },
    });

    if (!existingStarterMessage) {
      const message = await prisma.chatMessage.create({
        data: {
          chatId: chat.id,
          senderId: userId,
          content: starterMessage,
        },
        include: { sender: true },
      });

      this.io?.to(`chat:${chat.id}`).emit("newMessage", message);
    }

    return {
      chatId: chat.id,
      orderId,
    };
  }

  async createOrderFromCart(userId: string, cartId: string) {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        cartItems: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.cartItems.length === 0) {
      throw new AppError(400, "Cart is empty or not found");
    }
    if (cart.userId !== userId) {
      throw new AppError(403, "You are not authorized to access this cart");
    }

    const amount = cart.cartItems.reduce(
      (sum, item) => sum + item.quantity * item.variant.price,
      0
    );

    const orderItems = cart.cartItems.map((item) => ({
      variantId: item.variantId,
      quantity: item.quantity,
      price: item.variant.price,
    }));

    const order = await this.orderRepository.createOrder({
      userId,
      amount,
      goalTemplateId: cart.goalTemplateId,
      goalBundleId: cart.goalBundleId,
      orderItems,
    });

    this.emitOrderEvent(userId, {
      type: "order.created",
      orderId: order.id,
    });

    return order;
  }

  async createReminder(
    orderId: string,
    userId: string,
    remindAt: Date,
    note?: string
  ) {
    const order = await this.orderRepository.findOrderById(orderId);

    if (!order) {
      throw new AppError(404, "Order not found");
    }

    if (order.userId !== userId) {
      throw new AppError(403, "You are not authorized to update this order");
    }

    return prisma.orderReminder.create({
      data: {
        orderId,
        userId,
        remindAt,
        note,
      },
    });
  }
}
