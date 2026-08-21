import prisma from "@/infra/database/database.config";
import AppError from "@/shared/errors/AppError";
import { GOAL_BUNDLE_TYPE, GOAL_SUCCESS_STATUS } from "@prisma/client";
import { SharedCartService } from "../shared-cart/shared-cart.service";

type SeedGoalTemplate = {
  slug: string;
  title: string;
  description: string;
  audience: string;
  suggestedBudget: number;
  steps: Array<{
    stepKey: string;
    label: string;
    description: string;
    categoryNames: string[];
    fallbackKeywords: string[];
    budgetWeight: number;
    sortOrder: number;
  }>;
};

type Actor = {
  userId?: string;
  sessionId?: string;
};

type GuidedGoalBrief = {
  whoFor?: string;
  occasion?: string;
  deadline?: string;
  style?: string;
  mustHaves?: string[];
  avoidList?: string[];
  notes?: string;
  budgetMin?: number;
  budgetMax?: number;
};

type AssembleGoalOptions = Actor & {
  budget?: number;
  brief?: GuidedGoalBrief;
  bundleId?: string;
  lockedStepKeys?: string[];
  selectedVariants?: Record<string, string>;
  regenerateStepKeys?: string[];
};

type CustomBundleRequestItem = {
  key?: string;
  label: string;
  description?: string;
  quantity?: number;
  categoryNames?: string[];
  keywords?: string[];
  priority?: "HIGH" | "MEDIUM" | "LOW";
  targetBudget?: number;
};

type CustomBundleBrief = {
  name?: string;
  requestText?: string;
  style?: string;
  avoidList?: string[];
  notes?: string;
  items?: CustomBundleRequestItem[];
};

type NormalizedCustomBundleItem = {
  key: string;
  label: string;
  description?: string;
  quantity: number;
  categoryNames: string[];
  keywords: string[];
  priority: "HIGH" | "MEDIUM" | "LOW";
  targetBudget?: number;
};

type NormalizedCustomBundleBrief = {
  name?: string;
  requestText?: string;
  style?: string;
  avoidList: string[];
  notes?: string;
  items: NormalizedCustomBundleItem[];
};

type AssembleCustomBundleOptions = Actor & {
  budget?: number;
  brief?: CustomBundleBrief;
  bundleId?: string;
  lockedItemKeys?: string[];
  selectedVariants?: Record<string, string>;
  regenerateItemKeys?: string[];
};

type GoalTemplateStepView = {
  id: string;
  key: string;
  label: string;
  description: string;
  categoryNames: string[];
  fallbackKeywords: string[];
  budgetWeight: number;
  sortOrder: number;
};

type GoalTemplateView = {
  id: string;
  slug: string;
  title: string;
  description: string;
  audience: string;
  suggestedBudget: number;
  steps: GoalTemplateStepView[];
};

type CandidateView = {
  variantId: string;
  variantPrice: number;
  sku: string;
  image: string | null;
  productId: string;
  productName: string;
  productSlug: string;
  categoryName: string;
  stock: number;
  selectionReason: string;
  score: number;
  confidenceScore: number;
  confidenceLabel: string;
};

type SelectedStepItem = {
  stepKey: string;
  stepLabel: string;
  stepDescription: string;
  allocatedBudget: number;
  quantity: number;
  variantId: string;
  variantPrice: number;
  sku: string;
  image: string | null;
  productId: string;
  productName: string;
  productSlug: string;
  categoryName: string;
  stock: number;
  selectionReason: string;
  locked: boolean;
  confidenceScore: number;
  confidenceLabel: string;
  alternatives: CandidateView[];
};

type FrequentBundleSuggestion = {
  id: string;
  title: string;
  summary: string;
  frequency: number;
  total: number;
  bundleType: GOAL_BUNDLE_TYPE;
  items: Array<{
    stepKey: string;
    stepLabel: string;
    stepDescription: string;
    quantity: number;
    variantId: string;
    variantPrice: number;
    image: string | null;
    productId: string;
    productName: string;
    productSlug: string;
    categoryName: string;
    stock: number;
  }>;
};

type FrequentOrderItem = {
  quantity: number;
  variantId: string;
  variantPrice: number;
  image: string | null;
  sku: string;
  productId: string;
  productName: string;
  productSlug: string;
  categoryName: string;
  stock: number;
};

const DEFAULT_GOAL_TEMPLATES: SeedGoalTemplate[] = [
  {
    slug: "wfh-desk",
    title: "WFH Desk Reset",
    description:
      "Build a focused home-office setup with the essentials for comfort and deep work.",
    audience: "Remote workers who want a cleaner, more reliable desk setup.",
    suggestedBudget: 900,
    steps: [
      {
        stepKey: "desk-anchor",
        label: "Desk anchor",
        description: "Start with the main work surface or a hero desk item.",
        categoryNames: ["Furniture", "Office", "Desks"],
        fallbackKeywords: ["desk", "table", "workspace"],
        budgetWeight: 0.45,
        sortOrder: 1,
      },
      {
        stepKey: "comfort",
        label: "Comfort layer",
        description: "Add something that improves posture and long-session comfort.",
        categoryNames: ["Office", "Furniture", "Accessories"],
        fallbackKeywords: ["chair", "support", "comfort", "ergonomic"],
        budgetWeight: 0.3,
        sortOrder: 2,
      },
      {
        stepKey: "productivity",
        label: "Productivity boost",
        description: "Round it out with a practical accessory or organization piece.",
        categoryNames: ["Accessories", "Electronics", "Office"],
        fallbackKeywords: ["lamp", "organizer", "stand", "keyboard", "mouse"],
        budgetWeight: 0.25,
        sortOrder: 3,
      },
    ],
  },
  {
    slug: "travel-outfit",
    title: "Travel Outfit",
    description:
      "Create a flexible trip-ready outfit that balances comfort, layering, and carry convenience.",
    audience: "Travelers packing light but still wanting a polished look.",
    suggestedBudget: 350,
    steps: [
      {
        stepKey: "base",
        label: "Base outfit",
        description: "Pick the primary clothing item for the trip.",
        categoryNames: ["Clothing", "Fashion", "Apparel"],
        fallbackKeywords: ["shirt", "top", "pant", "dress", "jacket"],
        budgetWeight: 0.45,
        sortOrder: 1,
      },
      {
        stepKey: "layer",
        label: "Travel layer",
        description: "Choose a lightweight add-on for changing temperatures.",
        categoryNames: ["Clothing", "Fashion", "Apparel"],
        fallbackKeywords: ["hoodie", "jacket", "sweater", "layer"],
        budgetWeight: 0.3,
        sortOrder: 2,
      },
      {
        stepKey: "carry",
        label: "Carry companion",
        description: "Add a bag or practical accessory for the trip.",
        categoryNames: ["Accessories", "Bags", "Travel"],
        fallbackKeywords: ["bag", "backpack", "pouch", "travel"],
        budgetWeight: 0.25,
        sortOrder: 3,
      },
    ],
  },
  {
    slug: "gaming-starter-pack",
    title: "Gaming Starter Pack",
    description:
      "Assemble a first gaming setup with a core device, a control upgrade, and one finishing touch.",
    audience: "New gamers or anyone setting up a giftable starter bundle.",
    suggestedBudget: 1200,
    steps: [
      {
        stepKey: "core",
        label: "Core gear",
        description: "Choose the main gaming device or centerpiece.",
        categoryNames: ["Electronics", "Gaming", "Computers"],
        fallbackKeywords: ["console", "monitor", "pc", "gaming"],
        budgetWeight: 0.6,
        sortOrder: 1,
      },
      {
        stepKey: "control",
        label: "Control upgrade",
        description: "Add a precision accessory for play sessions.",
        categoryNames: ["Accessories", "Gaming", "Electronics"],
        fallbackKeywords: ["controller", "keyboard", "mouse", "headset"],
        budgetWeight: 0.25,
        sortOrder: 2,
      },
      {
        stepKey: "atmosphere",
        label: "Atmosphere",
        description: "Finish with comfort or mood-setting gear.",
        categoryNames: ["Accessories", "Gaming", "Furniture"],
        fallbackKeywords: ["chair", "lamp", "rgb", "stand"],
        budgetWeight: 0.15,
        sortOrder: 3,
      },
    ],
  },
];

const normalizeText = (value?: string | null) =>
  (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const splitKeywords = (value?: string | string[] | null) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .flatMap((entry) => entry.split(","))
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const uniqueKeywords = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

const slugifyKey = (value: string, fallback: string) => {
  const normalized = normalizeText(value).replace(/\s+/g, "-");
  return normalized || fallback;
};

const parseRequestItemsFromText = (value?: string | null) => {
  if (!value?.trim()) {
    return [];
  }

  return value
    .split(/\n|,|(?:\sand\s)/gi)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry, index) => ({
      label: entry,
      description: undefined,
      quantity: 1,
      key: slugifyKey(entry, `custom-item-${index + 1}`),
      categoryNames: [],
      keywords: [],
      priority: "MEDIUM" as const,
      targetBudget: undefined,
    }));
};

export class GoalService {
  private sharedCartService = new SharedCartService();

  private clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
  }

  private getConfidenceLabel(score: number) {
    if (score >= 85) {
      return "High confidence";
    }

    if (score >= 70) {
      return "Strong fit";
    }

    if (score >= 55) {
      return "Promising";
    }

    return "Needs review";
  }

  private deriveCandidateConfidence(
    score: number,
    price: number,
    stepBudget: number,
    stock: number
  ) {
    const priceAlignment =
      price <= stepBudget
        ? 100
        : Math.max(
            45,
            100 -
              (((price - stepBudget) / Math.max(stepBudget, 1)) * 100)
          );
    const scoreSignal = this.clamp(score, 0, 85);
    const stockSignal = this.clamp(stock * 2, 0, 18);
    const confidenceScore = this.clamp(
      Math.round(priceAlignment * 0.45 + scoreSignal * 0.4 + stockSignal),
      40,
      96
    );

    return {
      confidenceScore,
      confidenceLabel: this.getConfidenceLabel(confidenceScore),
    };
  }

  private deriveBundleConfidence(
    selectedItems: SelectedStepItem[],
    totalSteps: number,
    remainingBudget: number,
    targetBudget: number
  ) {
    if (!selectedItems.length) {
      return {
        confidenceScore: 0,
        confidenceLabel: this.getConfidenceLabel(0),
      };
    }

    const averageStepConfidence =
      selectedItems.reduce((sum, item) => sum + item.confidenceScore, 0) /
      selectedItems.length;
    const coverageBonus = (selectedItems.length / Math.max(totalSteps, 1)) * 16;
    const budgetComfort =
      remainingBudget >= 0
        ? Math.min((remainingBudget / Math.max(targetBudget, 1)) * 24, 10)
        : -12;
    const confidenceScore = this.clamp(
      Math.round(averageStepConfidence + coverageBonus + budgetComfort - 10),
      35,
      97
    );

    return {
      confidenceScore,
      confidenceLabel: this.getConfidenceLabel(confidenceScore),
    };
  }

  private formatGoal(goal: any): GoalTemplateView {
    return {
      id: goal.id,
      slug: goal.slug,
      title: goal.title,
      description: goal.description,
      audience: goal.audience,
      suggestedBudget: goal.suggestedBudget,
      steps: (goal.steps || [])
        .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
        .map((step: any) => ({
          id: step.id,
          key: step.stepKey,
          label: step.label,
          description: step.description,
          categoryNames: step.categoryNames || [],
          fallbackKeywords: step.fallbackKeywords || [],
          budgetWeight: step.budgetWeight,
          sortOrder: step.sortOrder,
        })),
    };
  }

  private normalizeBrief(brief?: GuidedGoalBrief): GuidedGoalBrief {
    if (!brief) {
      return {};
    }

    const budgetMin =
      typeof brief.budgetMin === "number" && brief.budgetMin > 0
        ? brief.budgetMin
        : undefined;
    const budgetMax =
      typeof brief.budgetMax === "number" && brief.budgetMax > 0
        ? brief.budgetMax
        : undefined;

    return {
      whoFor: brief.whoFor?.trim() || undefined,
      occasion: brief.occasion?.trim() || undefined,
      deadline: brief.deadline?.trim() || undefined,
      style: brief.style?.trim() || undefined,
      mustHaves: uniqueKeywords(splitKeywords(brief.mustHaves)),
      avoidList: uniqueKeywords(splitKeywords(brief.avoidList)),
      notes: brief.notes?.trim() || undefined,
      budgetMin,
      budgetMax,
    };
  }

  private normalizeCustomBrief(brief?: CustomBundleBrief): NormalizedCustomBundleBrief {
    const parsedItems = [
      ...(brief?.items || []),
      ...parseRequestItemsFromText(brief?.requestText),
    ];

    const normalizedItems = parsedItems
      .map((item, index) => ({
        key: item.key?.trim() || slugifyKey(item.label, `custom-item-${index + 1}`),
        label: item.label?.trim(),
        description: item.description?.trim() || undefined,
        quantity:
          typeof item.quantity === "number" && item.quantity > 0
            ? Math.max(1, Math.round(item.quantity))
            : 1,
        categoryNames: uniqueKeywords(splitKeywords(item.categoryNames)),
        keywords: uniqueKeywords(splitKeywords(item.keywords || item.label)),
        priority: item.priority || "MEDIUM",
        targetBudget:
          typeof item.targetBudget === "number" && item.targetBudget > 0
            ? item.targetBudget
            : undefined,
      }))
      .filter((item) => item.label);

    const deduped = Array.from(
      new Map(normalizedItems.map((item) => [item.key, item])).values()
    );

    return {
      name: brief?.name?.trim() || undefined,
      requestText: brief?.requestText?.trim() || undefined,
      style: brief?.style?.trim() || undefined,
      avoidList: uniqueKeywords(splitKeywords(brief?.avoidList)),
      notes: brief?.notes?.trim() || undefined,
      items: deduped,
    };
  }

  private deriveBundleName(goal: GoalTemplateView, brief: GuidedGoalBrief) {
    const fragments = [goal.title];

    if (brief.whoFor) {
      fragments.push(`for ${brief.whoFor}`);
    }

    if (brief.occasion) {
      fragments.push(`(${brief.occasion})`);
    }

    return fragments.join(" ").trim();
  }

  private deriveCustomBundleName(brief: NormalizedCustomBundleBrief) {
    if (brief.name) {
      return brief.name;
    }

    if (brief.requestText) {
      return `Custom bundle for ${brief.requestText}`;
    }

    const labels = (brief.items || []).slice(0, 2).map((item) => item.label);
    if (labels.length) {
      return `${labels.join(" + ")} bundle`;
    }

    return "Custom bundle";
  }

  private async ensureGoalTemplatesSeeded() {
    const count = await prisma.goalTemplate.count();

    if (count > 0) {
      return;
    }

    for (const template of DEFAULT_GOAL_TEMPLATES) {
      await prisma.goalTemplate.create({
        data: {
          slug: template.slug,
          title: template.title,
          description: template.description,
          audience: template.audience,
          suggestedBudget: template.suggestedBudget,
          steps: {
            create: template.steps,
          },
        },
      });
    }
  }

  private async findGoalOrThrow(slug: string) {
    await this.ensureGoalTemplatesSeeded();

    const goal = await prisma.goalTemplate.findUnique({
      where: { slug },
      include: {
        steps: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!goal) {
      throw new AppError(404, "Goal template not found");
    }

    return goal;
  }

  private async findBundleOrThrow(bundleId: string, actor: Actor) {
    const bundle = await prisma.goalBundle.findUnique({
      where: { id: bundleId },
      include: {
        goalTemplate: {
          include: {
            steps: {
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    category: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!bundle) {
      throw new AppError(404, "Goal bundle not found");
    }

    if (actor.userId) {
      if (bundle.userId && bundle.userId !== actor.userId) {
        throw new AppError(403, "You are not allowed to access this goal bundle");
      }
    } else if (actor.sessionId) {
      if (bundle.userId || bundle.sessionId !== actor.sessionId) {
        throw new AppError(403, "You are not allowed to access this goal bundle");
      }
    } else {
      throw new AppError(401, "A goal bundle session could not be identified");
    }

    return bundle;
  }

  private async getHistoricalProductBoost(goalTemplateId: string) {
    const successfulOrders = await prisma.order.findMany({
      where: {
        goalTemplateId,
        goalSuccessCheckin: {
          is: {
            status: {
              in: [GOAL_SUCCESS_STATUS.SUCCESS, GOAL_SUCCESS_STATUS.PARTIAL],
            },
          },
        },
      },
      include: {
        goalSuccessCheckin: {
          select: {
            status: true,
          },
        },
        orderItems: {
          select: {
            quantity: true,
            variant: {
              select: {
                productId: true,
              },
            },
          },
        },
      },
    });

    const boostMap = new Map<string, number>();

    for (const order of successfulOrders) {
      const multiplier =
        order.goalSuccessCheckin?.status === GOAL_SUCCESS_STATUS.SUCCESS ? 3 : 1;

      for (const item of order.orderItems) {
        const productId = item.variant?.productId;
        if (!productId) {
          continue;
        }

        boostMap.set(
          productId,
          (boostMap.get(productId) || 0) + item.quantity * multiplier
        );
      }
    }

    return boostMap;
  }

  private buildCandidateReason({
    step,
    price,
    stepBudget,
    stock,
    historicalBoost,
    text,
    brief,
  }: {
    step: GoalTemplateStepView;
    price: number;
    stepBudget: number;
    stock: number;
    historicalBoost: number;
    text: string;
    brief: GuidedGoalBrief;
  }) {
    const reasons = [`Supports the ${step.label.toLowerCase()} step.`];

    if (price <= stepBudget) {
      reasons.push("Fits the step budget.");
    } else {
      reasons.push("Best available despite stretching the step budget.");
    }

    if (stock > 0) {
      reasons.push("Currently in stock.");
    }

    if (brief.style && normalizeText(text).includes(normalizeText(brief.style))) {
      reasons.push(`Matches the requested ${brief.style.toLowerCase()} style.`);
    }

    if (brief.mustHaves?.some((keyword) => normalizeText(text).includes(normalizeText(keyword)))) {
      reasons.push("Includes one of the requested must-haves.");
    }

    if (historicalBoost > 0) {
      reasons.push("Performed well in similar successful goal orders.");
    }

    return reasons.join(" ");
  }

  private async buildStepCandidates(
    goal: GoalTemplateView,
    step: GoalTemplateStepView,
    stepBudget: number,
    brief: GuidedGoalBrief,
    chosenVariantIds: Set<string>,
    historicalProductBoost: Map<string, number>
  ) {
    const mustHaveTerms = brief.mustHaves || [];
    const avoidTerms = brief.avoidList || [];
    const styleTerm = brief.style ? [brief.style] : [];
    const queryTerms = uniqueKeywords([
      ...step.fallbackKeywords,
      ...mustHaveTerms,
      ...styleTerm,
    ]);

    const products = await prisma.product.findMany({
      where: {
        OR: [
          ...step.categoryNames.map((categoryName) => ({
            category: {
              name: {
                equals: categoryName,
                mode: "insensitive" as const,
              },
            },
          })),
          ...queryTerms.map((keyword) => ({
            name: {
              contains: keyword,
              mode: "insensitive" as const,
            },
          })),
          ...queryTerms.map((keyword) => ({
            description: {
              contains: keyword,
              mode: "insensitive" as const,
            },
          })),
        ],
      },
      include: {
        category: true,
        variants: {
          where: { stock: { gt: 0 } },
          orderBy: [{ price: "asc" }, { updatedAt: "desc" }],
        },
      },
      orderBy: [
        { isFeatured: "desc" },
        { isBestSeller: "desc" },
        { salesCount: "desc" },
        { createdAt: "desc" },
      ],
      take: 30,
    });

    const candidates: CandidateView[] = [];

    for (const product of products) {
      const searchableText = normalizeText(
        [
          product.name,
          product.description,
          product.category?.name,
          brief.style,
          brief.occasion,
        ]
          .filter(Boolean)
          .join(" ")
      );

      const avoidPenalty = avoidTerms.some((keyword) =>
        searchableText.includes(normalizeText(keyword))
      );

      if (avoidPenalty) {
        continue;
      }

      for (const variant of product.variants) {
        if (chosenVariantIds.has(variant.id)) {
          continue;
        }

        const historicalBoost = historicalProductBoost.get(product.id) || 0;
        const priceDelta = Math.abs(stepBudget - variant.price);
        const stepBudgetScore = variant.price <= stepBudget ? 24 : Math.max(10, 24 - priceDelta / 20);
        const mustHaveScore = mustHaveTerms.some((keyword) =>
          searchableText.includes(normalizeText(keyword))
        )
          ? 18
          : 0;
        const styleScore = brief.style && searchableText.includes(normalizeText(brief.style))
          ? 10
          : 0;
        const catalogSignal =
          (product.isFeatured ? 8 : 0) +
          (product.isBestSeller ? 8 : 0) +
          Math.min(product.salesCount / 10, 10);
        const stockScore = Math.min(variant.stock, 20) / 2;
        const score =
          Number(stepBudgetScore) +
          mustHaveScore +
          styleScore +
          catalogSignal +
          stockScore +
          historicalBoost;
        const confidence = this.deriveCandidateConfidence(
          score,
          variant.price,
          stepBudget,
          variant.stock
        );

        candidates.push({
          variantId: variant.id,
          variantPrice: variant.price,
          sku: variant.sku,
          image: variant.images?.[0] || null,
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          categoryName: product.category?.name || "General",
          stock: variant.stock,
          selectionReason: this.buildCandidateReason({
            step,
            price: variant.price,
            stepBudget,
            stock: variant.stock,
            historicalBoost,
            text: searchableText,
            brief,
          }),
          score,
          ...confidence,
        });
      }
    }

    return candidates.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.variantPrice - b.variantPrice;
    });
  }

  private buildCustomCandidateReason({
    item,
    price,
    itemBudget,
    stock,
    text,
    brief,
  }: {
    item: NormalizedCustomBundleItem;
    price: number;
    itemBudget: number;
    stock: number;
    text: string;
    brief: NormalizedCustomBundleBrief;
  }) {
    const reasons = [`Matches the request for ${item.label.toLowerCase()}.`];

    if (price <= itemBudget) {
      reasons.push("Fits this part of the bundle budget.");
    } else {
      reasons.push("Best available option even though it stretches this line item.");
    }

    if (stock > 0) {
      reasons.push("Currently in stock.");
    }

    if (brief.style && normalizeText(text).includes(normalizeText(brief.style))) {
      reasons.push(`Lines up with the ${brief.style.toLowerCase()} style request.`);
    }

    if (item.quantity > 1) {
      reasons.push(`Works for the requested quantity of ${item.quantity}.`);
    }

    return reasons.join(" ");
  }

  private async buildCustomItemCandidates(
    item: NormalizedCustomBundleItem,
    itemBudget: number,
    brief: NormalizedCustomBundleBrief,
    chosenVariantIds: Set<string>
  ) {
    const queryTerms = uniqueKeywords([
      ...(item.keywords || []),
      ...normalizeText(item.label)
        .split(" ")
        .filter((entry) => entry.length > 2),
      ...(brief.style ? [brief.style] : []),
    ]);

    const products = await prisma.product.findMany({
      where: {
        OR: [
          ...(item.categoryNames || []).map((categoryName) => ({
            category: {
              name: {
                equals: categoryName,
                mode: "insensitive" as const,
              },
            },
          })),
          ...queryTerms.map((keyword) => ({
            name: {
              contains: keyword,
              mode: "insensitive" as const,
            },
          })),
          ...queryTerms.map((keyword) => ({
            description: {
              contains: keyword,
              mode: "insensitive" as const,
            },
          })),
        ],
      },
      include: {
        category: true,
        variants: {
          where: { stock: { gte: item.quantity || 1 } },
          orderBy: [{ price: "asc" }, { updatedAt: "desc" }],
        },
      },
      orderBy: [
        { isBestSeller: "desc" },
        { isFeatured: "desc" },
        { salesCount: "desc" },
        { createdAt: "desc" },
      ],
      take: 36,
    });

    const candidates: CandidateView[] = [];
    const avoidTerms = brief.avoidList || [];

    for (const product of products) {
      const searchableText = normalizeText(
        [product.name, product.description, product.category?.name, brief.style]
          .filter(Boolean)
          .join(" ")
      );

      if (
        avoidTerms.some((keyword) =>
          searchableText.includes(normalizeText(keyword))
        )
      ) {
        continue;
      }

      const keywordHits = queryTerms.filter((keyword) =>
        searchableText.includes(normalizeText(keyword))
      ).length;

      for (const variant of product.variants) {
        if (chosenVariantIds.has(variant.id)) {
          continue;
        }

        const priceDelta = Math.abs(itemBudget - variant.price * (item.quantity || 1));
        const budgetScore =
          variant.price * (item.quantity || 1) <= itemBudget
            ? 26
            : Math.max(10, 26 - priceDelta / 25);
        const labelScore = Math.min(keywordHits * 8, 24);
        const styleScore =
          brief.style && searchableText.includes(normalizeText(brief.style))
            ? 10
            : 0;
        const catalogSignal =
          (product.isBestSeller ? 10 : 0) +
          (product.isFeatured ? 6 : 0) +
          Math.min(product.salesCount / 10, 10);
        const quantitySignal =
          variant.stock >= (item.quantity || 1) ? 8 : 0;
        const stockScore = Math.min(variant.stock, 20) / 2;
        const score =
          budgetScore +
          labelScore +
          styleScore +
          catalogSignal +
          quantitySignal +
          stockScore;
        const confidence = this.deriveCandidateConfidence(
          score,
          variant.price * (item.quantity || 1),
          itemBudget,
          variant.stock
        );

        candidates.push({
          variantId: variant.id,
          variantPrice: variant.price,
          sku: variant.sku,
          image: variant.images?.[0] || null,
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          categoryName: product.category?.name || "General",
          stock: variant.stock,
          selectionReason: this.buildCustomCandidateReason({
            item,
            price: variant.price * (item.quantity || 1),
            itemBudget,
            stock: variant.stock,
            text: searchableText,
            brief,
          }),
          score,
          ...confidence,
        });
      }
    }

    return candidates.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.variantPrice - b.variantPrice;
    });
  }

  private formatBundleListEntry(bundle: any) {
    const totalRequestedUnits = (bundle.items || []).reduce(
      (sum: number, item: any) => sum + Number(item.quantity || 1),
      0
    );

    return {
      id: bundle.id,
      bundleType: bundle.bundleType,
      name: bundle.name,
      shareCode: bundle.shareCode,
      budget: bundle.budget,
      total: bundle.total,
      remainingBudget: bundle.remainingBudget,
      completionRate: bundle.goalTemplate?.steps?.length
        ? Number(
            (((bundle.items || []).length / bundle.goalTemplate.steps.length) * 100).toFixed(2)
          )
        : totalRequestedUnits
          ? 100
          : 0,
      budgetUtilization: bundle.budget
        ? Number(((bundle.total / bundle.budget) * 100).toFixed(2))
        : 0,
      createdAt: bundle.createdAt,
      updatedAt: bundle.updatedAt,
      brief: bundle.brief || {},
      goal: bundle.goalTemplate ? this.formatGoal(bundle.goalTemplate) : null,
      items: (bundle.items || []).map((item: any) => ({
        id: item.id,
        stepKey: item.stepKey,
        stepLabel: item.stepLabel,
        stepDescription: item.stepDescription,
        allocatedBudget: item.allocatedBudget,
        quantity: item.quantity || 1,
        selectionReason: item.selectionReason,
        locked: item.locked,
        variantId: item.variantId,
        variantPrice: item.price,
        sku: item.variant?.sku,
        image: item.variant?.images?.[0] || null,
        productId: item.variant?.product?.id,
        productName: item.variant?.product?.name,
        productSlug: item.variant?.product?.slug,
        categoryName: item.variant?.product?.category?.name || "General",
        stock: item.variant?.stock || 0,
      })),
    };
  }

  private async getOrCreateCartForActor(actor: Actor) {
    if (actor.userId) {
      const existing = await prisma.cart.findFirst({
        where: {
          userId: actor.userId,
          status: "ACTIVE",
        },
        orderBy: { updatedAt: "desc" },
      });

      if (existing) {
        return existing;
      }

      return prisma.cart.create({
        data: {
          userId: actor.userId,
        },
      });
    }

    if (!actor.sessionId) {
      throw new AppError(401, "A cart session could not be identified");
    }

    const existing = await prisma.cart.findUnique({
      where: {
        sessionId: actor.sessionId,
      },
    });

    if (existing) {
      return existing;
    }

    return prisma.cart.create({
      data: {
        sessionId: actor.sessionId,
      },
    });
  }

  async listGoals() {
    await this.ensureGoalTemplatesSeeded();

    const goals = await prisma.goalTemplate.findMany({
      include: {
        steps: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return goals.map((goal) => this.formatGoal(goal));
  }

  async getGoal(slug: string) {
    const goal = await this.findGoalOrThrow(slug);
    return this.formatGoal(goal);
  }

  async listGoalTemplatesAdmin() {
    return this.listGoals();
  }

  async createGoalTemplate(payload: {
    slug: string;
    title: string;
    description: string;
    audience: string;
    suggestedBudget: number;
    steps: Array<{
      stepKey: string;
      label: string;
      description: string;
      categoryNames?: string[];
      fallbackKeywords?: string[];
      budgetWeight: number;
      sortOrder?: number;
    }>;
  }) {
    if (!payload.steps?.length) {
      throw new AppError(400, "At least one goal step is required");
    }

    const goal = await prisma.goalTemplate.create({
      data: {
        slug: payload.slug,
        title: payload.title,
        description: payload.description,
        audience: payload.audience,
        suggestedBudget: payload.suggestedBudget,
        steps: {
          create: payload.steps.map((step, index) => ({
            stepKey: step.stepKey,
            label: step.label,
            description: step.description,
            categoryNames: step.categoryNames || [],
            fallbackKeywords: step.fallbackKeywords || [],
            budgetWeight: step.budgetWeight,
            sortOrder: step.sortOrder ?? index + 1,
          })),
        },
      },
      include: {
        steps: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return this.formatGoal(goal);
  }

  async updateGoalTemplate(
    id: string,
    payload: {
      slug: string;
      title: string;
      description: string;
      audience: string;
      suggestedBudget: number;
      steps: Array<{
        stepKey: string;
        label: string;
        description: string;
        categoryNames?: string[];
        fallbackKeywords?: string[];
        budgetWeight: number;
        sortOrder?: number;
      }>;
    }
  ) {
    const existing = await prisma.goalTemplate.findUnique({
      where: { id },
      include: { steps: true },
    });

    if (!existing) {
      throw new AppError(404, "Goal template not found");
    }

    const goal = await prisma.goalTemplate.update({
      where: { id },
      data: {
        slug: payload.slug,
        title: payload.title,
        description: payload.description,
        audience: payload.audience,
        suggestedBudget: payload.suggestedBudget,
        steps: {
          deleteMany: {},
          create: payload.steps.map((step, index) => ({
            stepKey: step.stepKey,
            label: step.label,
            description: step.description,
            categoryNames: step.categoryNames || [],
            fallbackKeywords: step.fallbackKeywords || [],
            budgetWeight: step.budgetWeight,
            sortOrder: step.sortOrder ?? index + 1,
          })),
        },
      },
      include: {
        steps: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return this.formatGoal(goal);
  }

  async deleteGoalTemplate(id: string) {
    const existing = await prisma.goalTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError(404, "Goal template not found");
    }

    await prisma.goalTemplate.delete({
      where: { id },
    });

    return { id };
  }

  async assembleGoalBundle(slug: string, options: AssembleGoalOptions = {}) {
    const goal = this.formatGoal(await this.findGoalOrThrow(slug));
    const brief = this.normalizeBrief(options.brief);
    const targetBudgetFromBrief =
      brief.budgetMax || brief.budgetMin || undefined;
    const targetBudget =
      options.budget && options.budget > 0
        ? options.budget
        : targetBudgetFromBrief && targetBudgetFromBrief > 0
          ? targetBudgetFromBrief
          : Number(goal.suggestedBudget);
    const lockedStepKeys = new Set(options.lockedStepKeys || []);
    const regenerateStepKeys = new Set(options.regenerateStepKeys || []);
    const previousBundle = options.bundleId
      ? await this.findBundleOrThrow(options.bundleId, options)
      : null;

    if (
      previousBundle &&
      previousBundle.bundleType !== GOAL_BUNDLE_TYPE.CURATED
    ) {
      throw new AppError(400, "This bundle belongs to a different bundle flow");
    }

    const previousSelections = new Map<string, any>();

    if (previousBundle) {
      for (const item of previousBundle.items || []) {
        previousSelections.set(item.stepKey, item);
      }
    }

    const chosenVariantIds = new Set<string>();
    const selectedItems: SelectedStepItem[] = [];
    const missedSteps: string[] = [];
    const historicalProductBoost = await this.getHistoricalProductBoost(goal.id);

    for (const step of goal.steps) {
      const stepBudget = Math.max(targetBudget * step.budgetWeight, 20);
      const manuallySelectedVariantId = options.selectedVariants?.[step.key];
      const previousSelection = previousSelections.get(step.key);
      const shouldReuseExisting =
        !!previousSelection &&
        !regenerateStepKeys.has(step.key) &&
        !manuallySelectedVariantId &&
        lockedStepKeys.has(step.key);

      const candidates = await this.buildStepCandidates(
        goal,
        step,
        stepBudget,
        brief,
        chosenVariantIds,
        historicalProductBoost
      );

      let selectedCandidate =
        manuallySelectedVariantId
          ? candidates.find((candidate) => candidate.variantId === manuallySelectedVariantId)
          : null;

      if (!selectedCandidate && shouldReuseExisting) {
        selectedCandidate = candidates.find(
          (candidate) => candidate.variantId === previousSelection.variantId
        );
      }

      if (!selectedCandidate) {
        selectedCandidate =
          candidates.find((candidate) => candidate.variantPrice <= stepBudget) ||
          candidates[0];
      }

      if (!selectedCandidate) {
        missedSteps.push(step.label);
        continue;
      }

      chosenVariantIds.add(selectedCandidate.variantId);

      const alternatives = candidates
        .filter((candidate) =>
          candidate.variantId === selectedCandidate?.variantId ||
          !chosenVariantIds.has(candidate.variantId)
        )
        .slice(0, 3);

      selectedItems.push({
        stepKey: step.key,
        stepLabel: step.label,
        stepDescription: step.description,
        allocatedBudget: Number(stepBudget.toFixed(2)),
        quantity: 1,
        ...selectedCandidate,
        locked: lockedStepKeys.has(step.key),
        alternatives,
      });
    }

    const total = Number(
      selectedItems
        .reduce((sum, item) => sum + Number(item.variantPrice || 0) * Number(item.quantity || 1), 0)
        .toFixed(2)
    );
    const remainingBudget = Number(
      Math.max(targetBudget - total, 0).toFixed(2)
    );
    const bundleConfidence = this.deriveBundleConfidence(
      selectedItems,
      goal.steps.length,
      remainingBudget,
      targetBudget
    );

    const bundlePayload = {
      goalTemplateId: goal.id,
      bundleType: GOAL_BUNDLE_TYPE.CURATED,
      userId: options.userId,
      sessionId: options.userId ? null : options.sessionId,
      name: this.deriveBundleName(goal, brief),
      brief,
      budget: targetBudget,
      total,
      remainingBudget,
      items: {
        create: selectedItems.map((item) => ({
          stepKey: item.stepKey,
          stepLabel: item.stepLabel,
          stepDescription: item.stepDescription,
          variantId: item.variantId,
          allocatedBudget: item.allocatedBudget,
          price: item.variantPrice,
          quantity: item.quantity,
          selectionReason: item.selectionReason,
          locked: item.locked,
        })),
      },
    };

    const bundleRecord = previousBundle
      ? await prisma.goalBundle.update({
          where: { id: previousBundle.id },
          data: {
            name: bundlePayload.name,
            brief: bundlePayload.brief,
            budget: bundlePayload.budget,
            total: bundlePayload.total,
            remainingBudget: bundlePayload.remainingBudget,
            items: {
              deleteMany: {},
              create: bundlePayload.items.create,
            },
          },
        })
      : await prisma.goalBundle.create({
          data: bundlePayload,
        });

    return {
      id: bundleRecord.id,
      bundleType: GOAL_BUNDLE_TYPE.CURATED,
      name: bundlePayload.name,
      brief,
      goal,
      budget: targetBudget,
      total,
      remainingBudget,
      completionRate: goal.steps.length
        ? Number(((selectedItems.length / goal.steps.length) * 100).toFixed(2))
        : 0,
      ...bundleConfidence,
      missedSteps,
      items: selectedItems,
    };
  }

  async assembleCustomBundle(options: AssembleCustomBundleOptions = {}) {
    const brief = this.normalizeCustomBrief(options.brief);

    if (!brief.items?.length) {
      throw new AppError(
        400,
        "Add at least one requested item to build a custom bundle"
      );
    }

    const targetBudget =
      options.budget && options.budget > 0
        ? options.budget
        : brief.items.reduce(
            (sum, item) => sum + Number(item.targetBudget || 0),
            0
          ) || 300;
    const lockedItemKeys = new Set(options.lockedItemKeys || []);
    const regenerateItemKeys = new Set(options.regenerateItemKeys || []);
    const previousBundle = options.bundleId
      ? await this.findBundleOrThrow(options.bundleId, options)
      : null;

    if (
      previousBundle &&
      previousBundle.bundleType !== GOAL_BUNDLE_TYPE.CUSTOM
    ) {
      throw new AppError(400, "This bundle belongs to a different bundle flow");
    }

    const previousSelections = new Map<string, any>();

    if (previousBundle) {
      for (const item of previousBundle.items || []) {
        previousSelections.set(item.stepKey, item);
      }
    }

    const chosenVariantIds = new Set<string>();
    const selectedItems: SelectedStepItem[] = [];
    const missedItems: string[] = [];
    const defaultItemBudget = Math.max(
      targetBudget / Math.max(brief.items.length, 1),
      20
    );

    for (const item of brief.items) {
      const itemKey = item.key || slugifyKey(item.label, "custom-item");
      const priorityMultiplier =
        item.priority === "HIGH" ? 1.2 : item.priority === "LOW" ? 0.8 : 1;
      const itemBudget = Number(
        Math.max(
          item.targetBudget || defaultItemBudget * priorityMultiplier,
          20
        ).toFixed(2)
      );
      const manuallySelectedVariantId = options.selectedVariants?.[itemKey];
      const previousSelection = previousSelections.get(itemKey);
      const shouldReuseExisting =
        !!previousSelection &&
        !regenerateItemKeys.has(itemKey) &&
        !manuallySelectedVariantId &&
        lockedItemKeys.has(itemKey);

      const candidates = await this.buildCustomItemCandidates(
        item,
        itemBudget,
        brief,
        chosenVariantIds
      );

      let selectedCandidate = manuallySelectedVariantId
        ? candidates.find(
            (candidate) => candidate.variantId === manuallySelectedVariantId
          )
        : null;

      if (!selectedCandidate && shouldReuseExisting) {
        selectedCandidate = candidates.find(
          (candidate) => candidate.variantId === previousSelection.variantId
        );
      }

      if (!selectedCandidate) {
        selectedCandidate =
          candidates.find(
            (candidate) => candidate.variantPrice * item.quantity <= itemBudget
          ) || candidates[0];
      }

      if (!selectedCandidate) {
        missedItems.push(item.label);
        continue;
      }

      chosenVariantIds.add(selectedCandidate.variantId);

      const alternatives = candidates
        .filter(
          (candidate) =>
            candidate.variantId === selectedCandidate?.variantId ||
            !chosenVariantIds.has(candidate.variantId)
        )
        .slice(0, 3);

      selectedItems.push({
        stepKey: itemKey,
        stepLabel: item.label,
        stepDescription:
          item.description || `Requested item for ${item.label.toLowerCase()}.`,
        allocatedBudget: itemBudget,
        quantity: item.quantity || 1,
        ...selectedCandidate,
        locked: lockedItemKeys.has(itemKey),
        alternatives,
      });
    }

    const total = Number(
      selectedItems
        .reduce(
          (sum, item) =>
            sum + Number(item.variantPrice || 0) * Number(item.quantity || 1),
          0
        )
        .toFixed(2)
    );
    const remainingBudget = Number(
      Math.max(targetBudget - total, 0).toFixed(2)
    );
    const bundleConfidence = this.deriveBundleConfidence(
      selectedItems,
      brief.items.length,
      remainingBudget,
      targetBudget
    );
    const bundlePayload = {
      goalTemplateId: null,
      bundleType: GOAL_BUNDLE_TYPE.CUSTOM,
      userId: options.userId,
      sessionId: options.userId ? null : options.sessionId,
      name: this.deriveCustomBundleName(brief),
      brief,
      budget: targetBudget,
      total,
      remainingBudget,
      items: {
        create: selectedItems.map((item) => ({
          stepKey: item.stepKey,
          stepLabel: item.stepLabel,
          stepDescription: item.stepDescription,
          variantId: item.variantId,
          allocatedBudget: item.allocatedBudget,
          price: item.variantPrice,
          quantity: item.quantity,
          selectionReason: item.selectionReason,
          locked: item.locked,
        })),
      },
    };

    const bundleRecord = previousBundle
      ? await prisma.goalBundle.update({
          where: { id: previousBundle.id },
          data: {
            name: bundlePayload.name,
            brief: bundlePayload.brief,
            budget: bundlePayload.budget,
            total: bundlePayload.total,
            remainingBudget: bundlePayload.remainingBudget,
            items: {
              deleteMany: {},
              create: bundlePayload.items.create,
            },
          },
        })
      : await prisma.goalBundle.create({
          data: bundlePayload,
        });

    return {
      id: bundleRecord.id,
      bundleType: GOAL_BUNDLE_TYPE.CUSTOM,
      name: bundlePayload.name,
      brief,
      goal: null,
      budget: targetBudget,
      total,
      remainingBudget,
      completionRate: brief.items.length
        ? Number(((selectedItems.length / brief.items.length) * 100).toFixed(2))
        : 0,
      ...bundleConfidence,
      missedSteps: missedItems,
      items: selectedItems,
    };
  }

  async listFrequentBundles(limit = 6): Promise<FrequentBundleSuggestion[]> {
    const orders = await prisma.order.findMany({
      where: {
        orderItems: {
          some: {},
        },
      },
      orderBy: { orderDate: "desc" },
      take: 160,
      select: {
        id: true,
        orderItems: {
          select: {
            quantity: true,
            variant: {
              select: {
                id: true,
                price: true,
                stock: true,
                images: true,
                sku: true,
                product: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    category: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const pairMap = new Map<
      string,
      { count: number; total: number; items: FrequentBundleSuggestion["items"] }
    >();

    for (const order of orders) {
      const normalizedItems: FrequentOrderItem[] = (order.orderItems || [])
        .filter((item) => item.variant)
        .map((item) => ({
          quantity: Math.max(item.quantity || 1, 1),
          variantId: item.variant.id,
          variantPrice: item.variant.price,
          image: item.variant.images?.[0] || null,
          sku: item.variant.sku,
          productId: item.variant.product.id,
          productName: item.variant.product.name,
          productSlug: item.variant.product.slug,
          categoryName: item.variant.product.category?.name || "General",
          stock: item.variant.stock,
        }));

      if (normalizedItems.length < 2) {
        continue;
      }

      const uniqueItems = Array.from(
        new Map<string, FrequentOrderItem>(
          normalizedItems.map((item) => [item.variantId, item])
        ).values()
      );

      for (let index = 0; index < uniqueItems.length; index += 1) {
        for (let cursor = index + 1; cursor < uniqueItems.length; cursor += 1) {
          const pair: FrequentOrderItem[] = [
            uniqueItems[index],
            uniqueItems[cursor],
          ].sort((a, b) => a.variantId.localeCompare(b.variantId));
          const signature = pair.map((entry) => entry.variantId).join(":");
          const existing = pairMap.get(signature) || {
            count: 0,
            total: 0,
            items: pair.map((entry, pairIndex) => ({
              stepKey: `pair-${pairIndex + 1}`,
              stepLabel: entry.productName,
              stepDescription: `Frequently bought with ${pair[1 - pairIndex].productName}.`,
              quantity: entry.quantity,
              variantId: entry.variantId,
              variantPrice: entry.variantPrice,
              image: entry.image,
              productId: entry.productId,
              productName: entry.productName,
              productSlug: entry.productSlug,
              categoryName: entry.categoryName,
              stock: entry.stock,
            })),
          };

          existing.count += 1;
          existing.total = Number(
            (
              existing.items.reduce(
                (sum, item) => sum + item.variantPrice * item.quantity,
                0
              ) || 0
            ).toFixed(2)
          );
          pairMap.set(signature, existing);
        }
      }
    }

    let suggestions: FrequentBundleSuggestion[] = Array.from(pairMap.entries())
      .filter(([, entry]) => entry.count >= 2)
      .sort((a, b) => {
        if (b[1].count !== a[1].count) {
          return b[1].count - a[1].count;
        }

        return b[1].total - a[1].total;
      })
      .slice(0, limit)
      .map(([signature, entry]) => ({
        id: signature,
        title: entry.items.map((item) => item.productName).join(" + "),
        summary: `Bought together in ${entry.count} recent orders.`,
        frequency: entry.count,
        total: entry.total,
        bundleType: GOAL_BUNDLE_TYPE.FREQUENT,
        items: entry.items,
      }));

    if (!suggestions.length) {
      const fallbackProducts = await prisma.product.findMany({
        where: {
          variants: {
            some: {
              stock: { gt: 0 },
            },
          },
        },
        include: {
          category: true,
          variants: {
            where: { stock: { gt: 0 } },
            orderBy: { price: "asc" },
            take: 1,
          },
        },
        orderBy: [{ salesCount: "desc" }, { isBestSeller: "desc" }, { isFeatured: "desc" }],
        take: 6,
      });

      const starterSuggestions: FrequentBundleSuggestion[] = [];
      const fallbackPairs = fallbackProducts.filter((product) => product.variants?.[0]);

      for (let index = 0; index < fallbackPairs.length; index += 2) {
        const pair = fallbackPairs.slice(index, index + 2);
        if (pair.length < 2) {
          continue;
        }

        const mappedItems = pair.map((entry, pairIndex) => ({
          stepKey: `starter-${index + pairIndex + 1}`,
          stepLabel: entry.name,
          stepDescription: "Popular starter combination from current catalog demand.",
          quantity: 1,
          variantId: entry.variants[0].id,
          variantPrice: entry.variants[0].price,
          image: entry.variants[0].images?.[0] || null,
          productId: entry.id,
          productName: entry.name,
          productSlug: entry.slug,
          categoryName: entry.category?.name || "General",
          stock: entry.variants[0].stock,
        }));

        starterSuggestions.push({
          id: mappedItems.map((item) => item.variantId).join(":"),
          title: mappedItems.map((item) => item.productName).join(" + "),
          summary: "Popular starter combination from current catalog demand.",
          frequency: 1,
          total: Number(
            mappedItems
              .reduce((sum, item) => sum + item.variantPrice * item.quantity, 0)
              .toFixed(2)
          ),
          bundleType: GOAL_BUNDLE_TYPE.FREQUENT,
          items: mappedItems,
        });
      }

      suggestions = starterSuggestions.slice(0, limit);
    }

    return suggestions;
  }

  async listBundles(actor: Actor) {
    const where = actor.userId
      ? { userId: actor.userId }
      : actor.sessionId
        ? { sessionId: actor.sessionId, userId: null }
        : null;

    if (!where) {
      return [];
    }

    const bundles = await prisma.goalBundle.findMany({
      where,
      include: {
        goalTemplate: {
          include: {
            steps: {
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    category: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 12,
    });

    return bundles.map((bundle) => this.formatBundleListEntry(bundle));
  }

  async getBundle(bundleId: string, actor: Actor) {
    const bundle = await this.findBundleOrThrow(bundleId, actor);
    return this.formatBundleListEntry(bundle);
  }

  async applyBundleToCart(bundleId: string, actor: Actor) {
    const bundle = await this.findBundleOrThrow(bundleId, actor);
    const cart = await this.getOrCreateCartForActor(actor);

    await prisma.$transaction(async (tx) => {
      for (const item of bundle.items) {
        const existing = await tx.cartItem.findFirst({
          where: {
            cartId: cart.id,
            variantId: item.variantId,
          },
        });

        if (existing) {
          await tx.cartItem.update({
            where: { id: existing.id },
            data: {
              quantity: existing.quantity + (item.quantity || 1),
            },
          });
        } else {
          await tx.cartItem.create({
            data: {
              cartId: cart.id,
              variantId: item.variantId,
              quantity: item.quantity || 1,
            },
          });
        }
      }

      await tx.cart.update({
        where: { id: cart.id },
        data: {
          goalTemplateId: bundle.goalTemplateId,
          goalBundleId: bundle.id,
        },
      });
    });

    return this.getBundle(bundleId, actor);
  }

  async shareBundle(bundleId: string, actor: Actor & { title?: string }) {
    if (!actor.userId) {
      throw new AppError(401, "You need to be signed in to share a saved bundle");
    }

    const bundle = await this.findBundleOrThrow(bundleId, actor);
    return this.sharedCartService.createSharedCartFromGoalBundle(
      actor.userId,
      bundle.id,
      actor.title || bundle.name || bundle.goalTemplate?.title || "Shared bundle"
    );
  }

  async getGoalMetrics() {
    const [
      goalTemplates,
      bundleCounts,
      cartCounts,
      orderCounts,
      totalCarts,
      totalOrders,
      checkins,
    ] = await Promise.all([
      prisma.goalTemplate.findMany({
        include: {
          steps: {
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.goalBundle.groupBy({
        by: ["goalTemplateId"],
        _count: {
          _all: true,
        },
        where: {
          goalTemplateId: {
            not: null,
          },
          bundleType: GOAL_BUNDLE_TYPE.CURATED,
        },
      }),
      prisma.cart.groupBy({
        by: ["goalTemplateId"],
        _count: {
          _all: true,
        },
        where: {
          goalTemplateId: {
            not: null,
          },
        },
      }),
      prisma.order.groupBy({
        by: ["goalTemplateId"],
        _count: {
          _all: true,
        },
        where: {
          goalTemplateId: {
            not: null,
          },
        },
      }),
      prisma.cart.count(),
      prisma.order.count(),
      prisma.goalSuccessCheckin.groupBy({
        by: ["goalTemplateId", "status"],
        _count: {
          _all: true,
        },
        where: {
          goalTemplateId: {
            not: null,
          },
        },
      }),
    ]);

    const bundleCountMap = new Map(
      bundleCounts.map((entry) => [entry.goalTemplateId, entry._count._all])
    );
    const cartCountMap = new Map(
      cartCounts.map((entry) => [entry.goalTemplateId, entry._count._all])
    );
    const orderCountMap = new Map(
      orderCounts.map((entry) => [entry.goalTemplateId, entry._count._all])
    );
    const checkinMap = new Map<string, Record<string, number>>();

    for (const entry of checkins) {
      if (!entry.goalTemplateId) {
        continue;
      }

      const bucket = checkinMap.get(entry.goalTemplateId) || {};
      bucket[entry.status] = entry._count._all;
      checkinMap.set(entry.goalTemplateId, bucket);
    }

    return goalTemplates.map((goal) => {
      const goalCheckins = checkinMap.get(goal.id) || {};
      const successCount = goalCheckins[GOAL_SUCCESS_STATUS.SUCCESS] || 0;
      const partialCount = goalCheckins[GOAL_SUCCESS_STATUS.PARTIAL] || 0;
      const failedCount = goalCheckins[GOAL_SUCCESS_STATUS.FAILED] || 0;
      const totalCheckins = Object.values(goalCheckins).reduce(
        (sum, value) => sum + value,
        0
      );
      const bundleCount = bundleCountMap.get(goal.id) || 0;
      const cartAttachCount = cartCountMap.get(goal.id) || 0;
      const orderAttachCount = orderCountMap.get(goal.id) || 0;
      const troubledOutcomeCount = partialCount + failedCount;

      return {
        goal: this.formatGoal(goal),
        bundleCount,
        cartAttachCount,
        orderAttachCount,
        successCount,
        partialCount,
        failedCount,
        totalCheckins,
        goalAttachRate: Number(totalCarts)
          ? Number(
              ((Number(cartAttachCount) / Number(totalCarts)) * 100).toFixed(2)
            )
          : 0,
        bundleToCartRate: Number(bundleCount)
          ? Number(
              ((Number(cartAttachCount) / Number(bundleCount)) * 100).toFixed(2)
            )
          : 0,
        goalToOrderConversionRate: Number(cartAttachCount)
          ? Number(
              ((Number(orderAttachCount) / Number(cartAttachCount)) * 100).toFixed(2)
            )
          : 0,
        successRate: totalCheckins
          ? Number((((successCount + partialCount * 0.5) / totalCheckins) * 100).toFixed(2))
          : 0,
        recoveryRate: Number(troubledOutcomeCount)
          ? Number(
              ((Number(partialCount) / Number(troubledOutcomeCount)) * 100).toFixed(2)
            )
          : 0,
        orderShare: Number(totalOrders)
          ? Number(
              ((Number(orderAttachCount) / Number(totalOrders)) * 100).toFixed(2)
            )
          : 0,
      };
    });
  }
}
