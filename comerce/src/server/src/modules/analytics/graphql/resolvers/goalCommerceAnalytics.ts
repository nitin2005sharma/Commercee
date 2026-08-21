import {
  GOAL_BUNDLE_TYPE,
  GOAL_SUCCESS_STATUS,
  GOAL_STEP_SUCCESS_STATUS,
  SHARED_CART_ASSIGNMENT_STATUS,
} from "@prisma/client";
import { buildDateFilter, getDateRange } from "@/shared/utils/analytics";
import { Context } from "../resolver";

const toFixedNumber = (value: number, digits = 2) =>
  Number(value.toFixed(digits));

const goalCommerceAnalytics = {
  Query: {
    goalCommerceAnalytics: async (_: any, { params }: any, { prisma }: Context) => {
      const { timePeriod, year, startDate, endDate } = params;
      const { currentStartDate, yearStart, yearEnd } = getDateRange({
        timePeriod,
        year,
        startDate,
        endDate,
      });

      const rangeEnd = endDate ? new Date(endDate) : undefined;
      const createdAtFilter = buildDateFilter(
        currentStartDate,
        rangeEnd,
        yearStart,
        yearEnd
      );
      const orderDateFilter = buildDateFilter(
        currentStartDate,
        rangeEnd,
        yearStart,
        yearEnd
      );

      const [
        goalTemplates,
        bundles,
        carts,
        orders,
        totalCarts,
        totalOrders,
        checkins,
        stageCheckins,
        sharedCarts,
      ] = await Promise.all([
        prisma.goalTemplate.findMany({
          include: {
            steps: {
              orderBy: { sortOrder: "asc" },
            },
          },
          orderBy: { createdAt: "asc" },
        }),
        prisma.goalBundle.findMany({
          where: {
            goalTemplateId: {
              not: null,
            },
            bundleType: GOAL_BUNDLE_TYPE.CURATED,
            createdAt: createdAtFilter,
          },
          select: {
            id: true,
            goalTemplateId: true,
          },
        }),
        prisma.cart.findMany({
          where: {
            goalTemplateId: {
              not: null,
            },
            createdAt: createdAtFilter,
          },
          select: {
            id: true,
            goalTemplateId: true,
          },
        }),
        prisma.order.findMany({
          where: {
            goalTemplateId: {
              not: null,
            },
            orderDate: orderDateFilter,
          },
          select: {
            id: true,
            goalTemplateId: true,
          },
        }),
        prisma.cart.count({
          where: {
            createdAt: createdAtFilter,
          },
        }),
        prisma.order.count({
          where: {
            orderDate: orderDateFilter,
          },
        }),
        prisma.goalSuccessCheckin.findMany({
          where: {
            goalTemplateId: {
              not: null,
            },
            createdAt: createdAtFilter,
          },
          select: {
            goalTemplateId: true,
            status: true,
          },
        }),
        prisma.goalSuccessStageCheckin.findMany({
          where: {
            createdAt: createdAtFilter,
          },
          include: {
            checkin: {
              include: {
                goalTemplate: {
                  select: {
                    title: true,
                  },
                },
              },
            },
            steps: true,
          },
        }),
        prisma.sharedCart.findMany({
          where: {
            createdAt: createdAtFilter,
          },
          include: {
            members: {
              select: { id: true },
            },
            assignments: {
              select: {
                variantId: true,
                quantity: true,
                status: true,
              },
            },
            cart: {
              include: {
                cartItems: {
                  select: {
                    variantId: true,
                    quantity: true,
                  },
                },
              },
            },
          },
        }),
      ]);

      const bundleCountMap = new Map<string, number>();
      const cartCountMap = new Map<string, number>();
      const orderCountMap = new Map<string, number>();
      const checkinMap = new Map<
        string,
        { success: number; partial: number; failed: number; total: number }
      >();

      for (const bundle of bundles) {
        if (!bundle.goalTemplateId) {
          continue;
        }

        bundleCountMap.set(
          bundle.goalTemplateId,
          (bundleCountMap.get(bundle.goalTemplateId) || 0) + 1
        );
      }

      for (const cart of carts) {
        if (!cart.goalTemplateId) {
          continue;
        }

        cartCountMap.set(
          cart.goalTemplateId,
          (cartCountMap.get(cart.goalTemplateId) || 0) + 1
        );
      }

      for (const order of orders) {
        if (!order.goalTemplateId) {
          continue;
        }

        orderCountMap.set(
          order.goalTemplateId,
          (orderCountMap.get(order.goalTemplateId) || 0) + 1
        );
      }

      for (const checkin of checkins) {
        if (!checkin.goalTemplateId) {
          continue;
        }

        const bucket = checkinMap.get(checkin.goalTemplateId) || {
          success: 0,
          partial: 0,
          failed: 0,
          total: 0,
        };

        bucket.total += 1;

        if (checkin.status === GOAL_SUCCESS_STATUS.SUCCESS) {
          bucket.success += 1;
        } else if (checkin.status === GOAL_SUCCESS_STATUS.PARTIAL) {
          bucket.partial += 1;
        } else if (checkin.status === GOAL_SUCCESS_STATUS.FAILED) {
          bucket.failed += 1;
        }

        checkinMap.set(checkin.goalTemplateId, bucket);
      }

      const weakestStepMap = new Map<
        string,
        {
          stepKey: string;
          stepLabel: string;
          missCount: number;
          partialCount: number;
          goals: Set<string>;
        }
      >();

      for (const stageCheckin of stageCheckins) {
        for (const step of stageCheckin.steps || []) {
          if (
            step.status !== GOAL_STEP_SUCCESS_STATUS.MISSED &&
            step.status !== GOAL_STEP_SUCCESS_STATUS.PARTIAL
          ) {
            continue;
          }

          const key = `${step.stepKey}:${step.stepLabel}`;
          const entry = weakestStepMap.get(key) || {
            stepKey: step.stepKey,
            stepLabel: step.stepLabel,
            missCount: 0,
            partialCount: 0,
            goals: new Set<string>(),
          };

          if (step.status === GOAL_STEP_SUCCESS_STATUS.MISSED) {
            entry.missCount += 1;
          } else {
            entry.partialCount += 1;
          }

          if (stageCheckin.checkin?.goalTemplate?.title) {
            entry.goals.add(stageCheckin.checkin.goalTemplate.title);
          }

          weakestStepMap.set(key, entry);
        }
      }

      const goalMetrics = goalTemplates
        .map((goal) => {
          const bundleCount = bundleCountMap.get(goal.id) || 0;
          const cartAttachCount = cartCountMap.get(goal.id) || 0;
          const orderAttachCount = orderCountMap.get(goal.id) || 0;
          const checkinStats = checkinMap.get(goal.id) || {
            success: 0,
            partial: 0,
            failed: 0,
            total: 0,
          };
          const troubledOutcomeCount = checkinStats.partial + checkinStats.failed;

          return {
            id: goal.id,
            slug: goal.slug,
            title: goal.title,
            audience: goal.audience,
            bundleCount,
            cartAttachCount,
            orderAttachCount,
            successCount: checkinStats.success,
            partialCount: checkinStats.partial,
            failedCount: checkinStats.failed,
            totalCheckins: checkinStats.total,
            successRate: checkinStats.total
              ? toFixedNumber(
                  ((checkinStats.success + checkinStats.partial * 0.5) /
                    checkinStats.total) *
                    100
                )
              : 0,
            recoveryRate: troubledOutcomeCount
              ? toFixedNumber((checkinStats.partial / troubledOutcomeCount) * 100)
              : 0,
            goalAttachRate: totalCarts
              ? toFixedNumber((cartAttachCount / totalCarts) * 100)
              : 0,
            bundleToCartRate: bundleCount
              ? toFixedNumber((cartAttachCount / bundleCount) * 100)
              : 0,
            goalToOrderConversionRate: cartAttachCount
              ? toFixedNumber((orderAttachCount / cartAttachCount) * 100)
              : 0,
            orderShare: totalOrders
              ? toFixedNumber((orderAttachCount / totalOrders) * 100)
              : 0,
          };
        })
        .sort((a, b) => {
          if (b.orderAttachCount !== a.orderAttachCount) {
            return b.orderAttachCount - a.orderAttachCount;
          }

          return b.successRate - a.successRate;
        });

      const totalRequiredUnits = sharedCarts.reduce(
        (sum, cart) =>
          sum +
          (cart.cart?.cartItems || []).reduce(
            (itemSum, item) => itemSum + item.quantity,
            0
          ),
        0
      );
      const totalAssignedUnits = sharedCarts.reduce((sum, cart) => {
        return (
          sum +
          (cart.assignments || [])
            .filter(
              (assignment) =>
                assignment.status !== SHARED_CART_ASSIGNMENT_STATUS.RELEASED
            )
            .reduce((assignmentSum, assignment) => assignmentSum + assignment.quantity, 0)
        );
      }, 0);

      const readySharedCarts = sharedCarts.filter((sharedCart) => {
        return (sharedCart.cart?.cartItems || []).every((item) => {
          const assignedQuantity = (sharedCart.assignments || [])
            .filter(
              (assignment) =>
                assignment.variantId === item.variantId &&
                assignment.status !== SHARED_CART_ASSIGNMENT_STATUS.RELEASED
            )
            .reduce((sum, assignment) => sum + assignment.quantity, 0);

          return assignedQuantity >= item.quantity;
        });
      }).length;

      const avgSuccessRate = goalMetrics.length
        ? toFixedNumber(
            goalMetrics.reduce((sum, goal) => sum + goal.successRate, 0) /
              goalMetrics.length
          )
        : 0;

      const avgGoalToOrderConversionRate = goalMetrics.length
        ? toFixedNumber(
            goalMetrics.reduce(
              (sum, goal) => sum + goal.goalToOrderConversionRate,
              0
            ) / goalMetrics.length
          )
        : 0;

      return {
        totalBundles: bundles.length,
        totalGoalAttachedCarts: carts.length,
        totalGoalOrders: orders.length,
        totalCarts,
        totalOrders,
        totalSharedCarts: sharedCarts.length,
        readySharedCarts,
        goalAttachRate: totalCarts
          ? toFixedNumber((carts.length / totalCarts) * 100)
          : 0,
        bundleToCartRate: bundles.length
          ? toFixedNumber((carts.length / bundles.length) * 100)
          : 0,
        goalOrderConversionRate: carts.length
          ? toFixedNumber((orders.length / carts.length) * 100)
          : 0,
        avgSuccessRate,
        avgGoalToOrderConversionRate,
        avgCollaborators: sharedCarts.length
          ? toFixedNumber(
              sharedCarts.reduce(
                (sum, cart) => sum + (cart.members?.length || 0),
                0
              ) / sharedCarts.length
            )
          : 0,
        assignmentCoverageRate: totalRequiredUnits
          ? toFixedNumber(
              Math.min((totalAssignedUnits / totalRequiredUnits) * 100, 100)
            )
          : 0,
        goals: goalMetrics,
        weakestSteps: Array.from(weakestStepMap.values())
          .sort((a, b) => {
            if (b.missCount !== a.missCount) {
              return b.missCount - a.missCount;
            }

            return b.partialCount - a.partialCount;
          })
          .slice(0, 6)
          .map((entry) => ({
            stepKey: entry.stepKey,
            stepLabel: entry.stepLabel,
            missCount: entry.missCount,
            partialCount: entry.partialCount,
            goals: Array.from(entry.goals),
          })),
      };
    },
  },
};

export default goalCommerceAnalytics;
