export type SmartBundleComparisonWinner = "current" | "saved" | "tie";

export type SmartBundleComparisonRow = {
  label: string;
  currentDisplay: string;
  savedDisplay: string;
  winner: SmartBundleComparisonWinner;
};

export type SmartBundleComparison = {
  currentWins: number;
  savedWins: number;
  ties: number;
  verdict: string;
  rows: SmartBundleComparisonRow[];
  notes: string[];
};

type BundleComparisonOptions = {
  currentLockedKeys?: string[];
  savedLockedKeys?: string[];
  formatCurrency?: (value?: number) => string;
};

type BundleMetrics = {
  total: number;
  budget: number;
  remainingBudget: number;
  itemCount: number;
  lockedCount: number;
  confidence: number;
  coverage: number;
};

const toNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const defaultFormatCurrency = (value?: number) =>
  typeof value === "number" ? `$${value.toFixed(2)}` : "$0.00";

const formatPercent = (value: number) => `${Math.round(value)}%`;

const getBundleMetrics = (bundle: any, lockedKeys: string[] = []): BundleMetrics => {
  const items = Array.isArray(bundle?.items) ? bundle.items : [];
  const lockedKeySet = new Set(lockedKeys);
  const total = toNumber(bundle?.total);
  const budget = toNumber(bundle?.budget);
  const remainingBudget = Number.isFinite(bundle?.remainingBudget)
    ? toNumber(bundle?.remainingBudget)
    : budget
      ? budget - total
      : 0;

  const lockedCount = items.filter(
    (item: any) => item?.locked || lockedKeySet.has(item?.stepKey)
  ).length;

  return {
    total,
    budget,
    remainingBudget,
    itemCount: items.length,
    lockedCount,
    confidence: toNumber(bundle?.confidenceScore),
    coverage: toNumber(bundle?.completionRate),
  };
};

const pickWinner = (
  currentValue: number,
  savedValue: number,
  better: "higher" | "lower"
): SmartBundleComparisonWinner => {
  if (Math.abs(currentValue - savedValue) < 0.01) {
    return "tie";
  }

  if (better === "higher") {
    return currentValue > savedValue ? "current" : "saved";
  }

  return currentValue < savedValue ? "current" : "saved";
};

export const buildSmartBundleComparison = (
  currentBundle: any,
  savedBundle: any,
  options: BundleComparisonOptions = {}
): SmartBundleComparison => {
  const formatCurrency = options.formatCurrency || defaultFormatCurrency;
  const current = getBundleMetrics(currentBundle, options.currentLockedKeys);
  const saved = getBundleMetrics(savedBundle, options.savedLockedKeys);

  const rows: SmartBundleComparisonRow[] = [
    {
      label: "Total price",
      currentDisplay: formatCurrency(current.total),
      savedDisplay: formatCurrency(saved.total),
      winner: pickWinner(current.total, saved.total, "lower"),
    },
    {
      label: "Budget left",
      currentDisplay: formatCurrency(current.remainingBudget),
      savedDisplay: formatCurrency(saved.remainingBudget),
      winner: pickWinner(current.remainingBudget, saved.remainingBudget, "higher"),
    },
    {
      label: "Items covered",
      currentDisplay: String(current.itemCount),
      savedDisplay: String(saved.itemCount),
      winner: pickWinner(current.itemCount, saved.itemCount, "higher"),
    },
    {
      label: "Locked picks",
      currentDisplay: String(current.lockedCount),
      savedDisplay: String(saved.lockedCount),
      winner: pickWinner(current.lockedCount, saved.lockedCount, "higher"),
    },
    {
      label: "Confidence",
      currentDisplay: formatPercent(current.confidence),
      savedDisplay: formatPercent(saved.confidence),
      winner: pickWinner(current.confidence, saved.confidence, "higher"),
    },
    {
      label: "Brief coverage",
      currentDisplay: formatPercent(current.coverage),
      savedDisplay: formatPercent(saved.coverage),
      winner: pickWinner(current.coverage, saved.coverage, "higher"),
    },
  ];

  const currentWins = rows.filter((row) => row.winner === "current").length;
  const savedWins = rows.filter((row) => row.winner === "saved").length;
  const ties = rows.length - currentWins - savedWins;
  const priceDifference = Math.abs(current.total - saved.total);
  const budgetDifference = Math.abs(current.remainingBudget - saved.remainingBudget);
  const confidenceDifference = Math.abs(current.confidence - saved.confidence);
  const notes: string[] = [];

  if (priceDifference >= 1) {
    notes.push(
      current.total < saved.total
        ? `Current bundle is cheaper by ${formatCurrency(priceDifference)}.`
        : `Saved bundle is cheaper by ${formatCurrency(priceDifference)}.`
    );
  }

  if (budgetDifference >= 1) {
    notes.push(
      current.remainingBudget > saved.remainingBudget
        ? `Current bundle leaves ${formatCurrency(budgetDifference)} more room.`
        : `Saved bundle leaves ${formatCurrency(budgetDifference)} more room.`
    );
  }

  if (confidenceDifference >= 1) {
    notes.push(
      current.confidence > saved.confidence
        ? "Current bundle has the stronger confidence score."
        : "Saved bundle has the stronger confidence score."
    );
  }

  if (current.lockedCount !== saved.lockedCount) {
    notes.push(
      current.lockedCount > saved.lockedCount
        ? "Current bundle keeps more of your locked choices."
        : "Saved bundle keeps more locked choices from that draft."
    );
  }

  return {
    currentWins,
    savedWins,
    ties,
    verdict:
      currentWins > savedWins
        ? "Current bundle is the better fit right now."
        : savedWins > currentWins
          ? "Saved bundle may be the safer pick."
          : "Both bundles are close. Use the item details to decide.",
    rows,
    notes: notes.slice(0, 4),
  };
};
