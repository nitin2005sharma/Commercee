import {
  GOAL_SUCCESS_INTERVENTION_TYPE,
  GOAL_SUCCESS_REASON,
  GOAL_SUCCESS_STATUS,
} from "@prisma/client";

type OrderSignalItem = {
  productName: string;
  description?: string | null;
  categoryName?: string | null;
};

type GoalStepInput = {
  key?: string;
  stepKey?: string;
  label: string;
  description: string;
  categoryNames?: string[];
  fallbackKeywords?: string[];
};

type GoalTemplateInput = {
  id: string;
  slug: string;
  title: string;
  description: string;
  audience?: string;
  suggestedBudget?: number;
  steps: GoalStepInput[];
};

export type GoalTemplateMatch = {
  id: string;
  slug: string;
  title: string;
  description: string;
  audience?: string;
  suggestedBudget?: number;
  score: number;
  whyItFits: string;
  matchedSteps: Array<{
    key: string;
    label: string;
    description: string;
  }>;
  missingSteps: Array<{
    key: string;
    label: string;
    description: string;
  }>;
};

type BuildInterventionsInput = {
  orderId: string;
  status: GOAL_SUCCESS_STATUS;
  primaryReason?: GOAL_SUCCESS_REASON | null;
  goalTemplate?: {
    slug: string;
    title: string;
  } | null;
  missingSteps?: Array<{
    key: string;
    label: string;
    description: string;
  }>;
};

const buildGoalSupportHref = ({
  orderId,
  status,
  primaryReason,
}: {
  orderId: string;
  status: GOAL_SUCCESS_STATUS;
  primaryReason?: GOAL_SUCCESS_REASON | null;
}) => {
  const params = new URLSearchParams({
    orderId,
    goalStatus: status,
  });

  if (primaryReason) {
    params.set("goalReason", primaryReason);
  }

  return `/support?${params.toString()}`;
};

const normalize = (value?: string | null) =>
  (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (value?: string | null) =>
  normalize(value)
    .split(" ")
    .filter(Boolean);

const matchKeyword = (haystack: string, keyword: string) => {
  const normalizedKeyword = normalize(keyword);
  if (!normalizedKeyword) {
    return false;
  }

  return haystack.includes(normalizedKeyword);
};

const stepMatchesOrderItem = (
  step: GoalStepInput,
  orderItem: OrderSignalItem
) => {
  const categoryName = normalize(orderItem.categoryName);
  const searchableText = normalize(
    [orderItem.productName, orderItem.description, orderItem.categoryName]
      .filter(Boolean)
      .join(" ")
  );

  const categoryMatch = (step.categoryNames || []).some(
    (category) =>
      normalize(category) === categoryName ||
      searchableText.includes(normalize(category))
  );

  const keywordMatch = (step.fallbackKeywords || []).some((keyword) =>
    matchKeyword(searchableText, keyword)
  );

  return categoryMatch || keywordMatch;
};

const buildWhyItFits = (
  goal: GoalTemplateInput,
  matchedSteps: GoalTemplateMatch["matchedSteps"],
  missingSteps: GoalTemplateMatch["missingSteps"]
) => {
  if (matchedSteps.length === goal.steps.length) {
    return `This order covers all ${goal.title} steps.`;
  }

  if (matchedSteps.length > 0 && missingSteps.length > 0) {
    return `This order already covers ${matchedSteps
      .slice(0, 2)
      .map((step) => step.label)
      .join(" and ")}.`;
  }

  return `This order has some signals for ${goal.title}.`;
};

export const buildGoalTemplateMatches = (
  orderItems: OrderSignalItem[],
  goalTemplates: GoalTemplateInput[]
): GoalTemplateMatch[] => {
  if (!orderItems.length || !goalTemplates.length) {
    return [];
  }

  return goalTemplates
    .map((goal) => {
      const matchedSteps = goal.steps
        .filter((step) => orderItems.some((item) => stepMatchesOrderItem(step, item)))
        .map((step) => ({
          key: step.key || step.stepKey || step.label,
          label: step.label,
          description: step.description,
        }));

      const missingSteps = goal.steps
        .filter(
          (step) =>
            !matchedSteps.some(
              (matchedStep) =>
                matchedStep.key === (step.key || step.stepKey || step.label)
            )
        )
        .map((step) => ({
          key: step.key || step.stepKey || step.label,
          label: step.label,
          description: step.description,
        }));

      const matchedLabels = matchedSteps.map((step) => normalize(step.label));
      const textualBoost = orderItems.reduce((score, item) => {
        const tokens = new Set(
          tokenize([item.productName, item.description, item.categoryName].join(" "))
        );

        return (
          score +
          matchedSteps.reduce((stepScore, step) => {
            if (matchedLabels.includes(normalize(step.label))) {
              return stepScore + (tokens.has(normalize(step.label)) ? 1 : 0);
            }

            return stepScore;
          }, 0)
        );
      }, 0);

      const stepCoverage = goal.steps.length
        ? matchedSteps.length / goal.steps.length
        : 0;

      const score = Number((stepCoverage * 100 + textualBoost).toFixed(2));

      return {
        id: goal.id,
        slug: goal.slug,
        title: goal.title,
        description: goal.description,
        audience: goal.audience,
        suggestedBudget: goal.suggestedBudget,
        score,
        whyItFits: buildWhyItFits(goal, matchedSteps, missingSteps),
        matchedSteps,
        missingSteps,
      };
    })
    .filter((goal) => goal.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
};

const dedupeInterventions = (
  interventions: Array<{
    type: GOAL_SUCCESS_INTERVENTION_TYPE;
    title: string;
    description: string;
    ctaLabel?: string;
    ctaHref?: string;
    sortOrder: number;
  }>
) => {
  const seen = new Set<string>();

  return interventions.filter((intervention) => {
    const key = `${intervention.type}:${intervention.title}:${intervention.ctaHref || ""}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

export const buildGoalSuccessInterventions = ({
  orderId,
  status,
  primaryReason,
  goalTemplate,
  missingSteps = [],
}: BuildInterventionsInput) => {
  const interventions: Array<{
    type: GOAL_SUCCESS_INTERVENTION_TYPE;
    title: string;
    description: string;
    ctaLabel?: string;
    ctaHref?: string;
    sortOrder: number;
  }> = [];

  if (status === GOAL_SUCCESS_STATUS.SUCCESS) {
    interventions.push(
      {
        type: GOAL_SUCCESS_INTERVENTION_TYPE.REVIEW,
        title: "Capture what worked",
        description:
          "This outcome landed well. A product review or setup note will make future recommendations sharper.",
        ctaLabel: "Review this order",
        ctaHref: `/orders/${orderId}`,
        sortOrder: 1,
      },
      {
        type: GOAL_SUCCESS_INTERVENTION_TYPE.REMINDER,
        title: "Save a follow-up reminder",
        description:
          "Set a reminder while the successful setup is fresh so you can revisit, reorder, or refresh it later.",
        ctaLabel: "Set reminder",
        ctaHref: `/orders/${orderId}`,
        sortOrder: 2,
      }
    );
  }

  if (
    (status === GOAL_SUCCESS_STATUS.PARTIAL ||
      status === GOAL_SUCCESS_STATUS.FAILED) &&
    goalTemplate &&
    missingSteps.length
  ) {
    missingSteps.slice(0, 2).forEach((step, index) => {
      interventions.push({
        type: GOAL_SUCCESS_INTERVENTION_TYPE.MISSING_STEP,
        title: `Fill the missing step: ${step.label}`,
        description:
          primaryReason === GOAL_SUCCESS_REASON.MISSING_ITEM
            ? step.description
            : `${step.description} This is one of the missing pieces still blocking the outcome.`,
        ctaLabel: "Rebuild this goal",
        ctaHref: `/goals/${goalTemplate.slug}`,
        sortOrder: index + 1,
      });
    });
  }

  if (
    status === GOAL_SUCCESS_STATUS.PARTIAL ||
    status === GOAL_SUCCESS_STATUS.FAILED
  ) {
    if (primaryReason === GOAL_SUCCESS_REASON.SETUP) {
      interventions.push({
        type: GOAL_SUCCESS_INTERVENTION_TYPE.CARE_GUIDE,
        title: "Use the order companion",
        description:
          "The issue may be setup-related. Revisit the care, setup, and warranty guidance tied to this order.",
        ctaLabel: "Open companion",
        ctaHref: `/orders/${orderId}`,
        sortOrder: interventions.length + 1,
      });
    }

    if (
      primaryReason === GOAL_SUCCESS_REASON.FIT ||
      primaryReason === GOAL_SUCCESS_REASON.STYLE ||
      primaryReason === GOAL_SUCCESS_REASON.WRONG_MATCH
    ) {
      interventions.push({
        type: GOAL_SUCCESS_INTERVENTION_TYPE.EXCHANGE,
        title: "Escalate for a better match",
        description:
          "A support-guided exchange or replacement conversation is the fastest path when the current selection is not right.",
        ctaLabel: "Talk to support",
        ctaHref: buildGoalSupportHref({
          orderId,
          status,
          primaryReason,
        }),
        sortOrder: interventions.length + 1,
      });
    }

    if (
      primaryReason === GOAL_SUCCESS_REASON.BUDGET &&
      goalTemplate
    ) {
      interventions.push({
        type: GOAL_SUCCESS_INTERVENTION_TYPE.CURATION,
        title: "Try a leaner version of this goal",
        description:
          "Rebuild the same goal with a tighter budget to keep the intent while reducing spend.",
        ctaLabel: "Rebuild with a budget",
        ctaHref: `/goals/${goalTemplate.slug}`,
        sortOrder: interventions.length + 1,
      });
    }

    interventions.push({
      type: GOAL_SUCCESS_INTERVENTION_TYPE.SUPPORT_CHAT,
      title: "Get human help on this order",
      description:
        "Open support with the order context attached so the team can help recover the outcome quickly.",
      ctaLabel: "Open support",
      ctaHref: buildGoalSupportHref({
        orderId,
        status,
        primaryReason,
      }),
      sortOrder: interventions.length + 1,
    });
  }

  return dedupeInterventions(interventions);
};

export const buildGoalSuccessSummary = ({
  status,
  selectedGoalTitle,
  recommendedGoals,
}: {
  status?: GOAL_SUCCESS_STATUS | null;
  selectedGoalTitle?: string | null;
  recommendedGoals: GoalTemplateMatch[];
}) => {
  if (status === GOAL_SUCCESS_STATUS.SUCCESS) {
    return `This order appears to have completed the goal${selectedGoalTitle ? `: ${selectedGoalTitle}` : ""}.`;
  }

  if (status === GOAL_SUCCESS_STATUS.PARTIAL) {
    return `This order moved the user forward, but it did not fully complete the intended outcome yet.`;
  }

  if (status === GOAL_SUCCESS_STATUS.FAILED) {
    return `This order did not land the intended outcome, so the next step should focus on recovery.`;
  }

  if (recommendedGoals.length > 0) {
    const topGoal = recommendedGoals[0];
    return `This order most likely maps to the goal "${topGoal.title}" based on the purchased items.`;
  }

  return "This order can still collect post-purchase outcome feedback, even without a strong goal match.";
};
