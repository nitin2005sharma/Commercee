"use client";

import MainLayout from "@/app/components/templates/MainLayout";
import useToast from "@/app/hooks/ui/useToast";
import {
  useApplyGoalBundleToCartMutation,
  useAssembleGoalMutation,
  useGetGoalBundlesQuery,
  useGetGoalQuery,
  useShareGoalBundleMutation,
} from "@/app/store/apis/GoalApi";
import { buildSmartBundleComparison } from "@/app/utils/smartBundleComparison";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  CopyPlus,
  Lock,
  LockOpen,
  RefreshCcw,
  Share2,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const formatCurrency = (value?: number) =>
  typeof value === "number" ? `$${value.toFixed(2)}` : "$0.00";

const GoalDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const { data, isLoading } = useGetGoalQuery(slug);
  const { data: bundlesData } = useGetGoalBundlesQuery(undefined);
  const [assembleGoal, { isLoading: isAssembling }] = useAssembleGoalMutation();
  const [applyGoalBundleToCart, { isLoading: isApplyingBundle }] =
    useApplyGoalBundleToCartMutation();
  const [shareGoalBundle, { isLoading: isSharingBundle }] =
    useShareGoalBundleMutation();

  const [brief, setBrief] = useState({
    whoFor: "",
    occasion: "",
    deadline: "",
    style: "",
    mustHaves: "",
    avoidList: "",
    notes: "",
    budgetMin: "",
    budgetMax: "",
  });
  const [budget, setBudget] = useState<number | "">("");
  const [bundle, setBundle] = useState<any>(null);
  const [comparisonBundleId, setComparisonBundleId] = useState<string>("");
  const [lockedStepKeys, setLockedStepKeys] = useState<string[]>([]);

  const goal = data?.goal;
  const savedBundles = useMemo(() => {
    const bundles = bundlesData?.bundles || [];
    if (!goal?.id) {
      return [];
    }

    return bundles.filter((entry: any) => entry.goal?.id === goal.id);
  }, [bundlesData?.bundles, goal?.id]);

  const comparisonBundle =
    savedBundles.find((entry: any) => entry.id === comparisonBundleId) || null;
  const smartComparison = useMemo(() => {
    if (!bundle || !comparisonBundle) {
      return null;
    }

    return buildSmartBundleComparison(bundle, comparisonBundle, {
      currentLockedKeys: lockedStepKeys,
      formatCurrency,
    });
  }, [bundle, comparisonBundle, lockedStepKeys]);

  const effectiveBudget = useMemo(() => {
    if (typeof budget === "number" && budget > 0) {
      return budget;
    }

    if (brief.budgetMax) {
      return Number(brief.budgetMax);
    }

    return goal?.suggestedBudget || 0;
  }, [budget, brief.budgetMax, goal?.suggestedBudget]);

  const buildBriefPayload = () => ({
    whoFor: brief.whoFor.trim() || undefined,
    occasion: brief.occasion.trim() || undefined,
    deadline: brief.deadline.trim() || undefined,
    style: brief.style.trim() || undefined,
    mustHaves: brief.mustHaves
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
    avoidList: brief.avoidList
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
    notes: brief.notes.trim() || undefined,
    budgetMin: brief.budgetMin ? Number(brief.budgetMin) : undefined,
    budgetMax: brief.budgetMax ? Number(brief.budgetMax) : undefined,
  });

  const handleAssemble = async (options?: {
    bundleId?: string;
    regenerateStepKeys?: string[];
    selectedVariants?: Record<string, string>;
    nextLockedStepKeys?: string[];
  }) => {
    try {
      const nextLockedStepKeys = options?.nextLockedStepKeys || lockedStepKeys;
      const result = await assembleGoal({
        slug,
        budget: effectiveBudget,
        brief: buildBriefPayload(),
        bundleId: options?.bundleId || bundle?.id,
        regenerateStepKeys: options?.regenerateStepKeys,
        selectedVariants: options?.selectedVariants,
        lockedStepKeys: nextLockedStepKeys,
      }).unwrap();

      setBundle(result.bundle);
      setLockedStepKeys(nextLockedStepKeys);
    } catch (error: any) {
      const message =
        error?.data?.message ||
        error?.message ||
        "Could not build this goal bundle";
      showToast(message, "error");
    }
  };

  const handleLoadBundle = async (savedBundle: any) => {
    setBudget(savedBundle.budget || "");
    setBrief({
      whoFor: savedBundle.brief?.whoFor || "",
      occasion: savedBundle.brief?.occasion || "",
      deadline: savedBundle.brief?.deadline || "",
      style: savedBundle.brief?.style || "",
      mustHaves: (savedBundle.brief?.mustHaves || []).join(", "),
      avoidList: (savedBundle.brief?.avoidList || []).join(", "),
      notes: savedBundle.brief?.notes || "",
      budgetMin: savedBundle.brief?.budgetMin
        ? String(savedBundle.brief.budgetMin)
        : "",
      budgetMax: savedBundle.brief?.budgetMax
        ? String(savedBundle.brief.budgetMax)
        : "",
    });

    await handleAssemble({
      bundleId: savedBundle.id,
      nextLockedStepKeys: (savedBundle.items || [])
        .filter((item: any) => item.locked)
        .map((item: any) => item.stepKey),
    });
  };

  const handleSwapVariant = async (stepKey: string, variantId: string) => {
    await handleAssemble({
      selectedVariants: { [stepKey]: variantId },
      regenerateStepKeys: [stepKey],
    });
  };

  const handleToggleLock = (stepKey: string) => {
    setLockedStepKeys((current) =>
      current.includes(stepKey)
        ? current.filter((entry) => entry !== stepKey)
        : [...current, stepKey]
    );
  };

  const handleApplyToCart = async () => {
    if (!bundle?.id) {
      return;
    }

    try {
      await applyGoalBundleToCart(bundle.id).unwrap();
      showToast("Bundle attached to your cart", "success");
    } catch (error: any) {
      const message =
        error?.data?.message ||
        error?.message ||
        "Could not apply this bundle to the cart";
      showToast(message, "error");
    }
  };

  const handleShareBundle = async () => {
    if (!bundle?.id) {
      return;
    }

    try {
      const result = await shareGoalBundle({
        bundleId: bundle.id,
        title: bundle.name,
      }).unwrap();
      showToast("Shared cart created from this bundle", "success");
      router.push(`/cart/share/${result.sharedCart.code}`);
    } catch (error: any) {
      const message =
        error?.data?.message ||
        error?.message ||
        "You need to be signed in to share this bundle";
      showToast(message, "error");
    }
  };

  const handleCopyBundleSummary = async () => {
    if (!bundle?.items?.length) {
      return;
    }

    const summary = [
      bundle.name || goal?.title || "Goal bundle",
      `Budget: ${formatCurrency(bundle.budget)}`,
      `Total: ${formatCurrency(bundle.total)}`,
      ...bundle.items.map(
        (item: any) =>
          `${item.stepLabel}: ${item.productName} (${formatCurrency(item.variantPrice)})`
      ),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(summary);
      showToast("Bundle summary copied", "success");
    } catch {
      showToast("Could not copy the bundle summary", "error");
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <Link
          href="/goals"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600"
        >
          <ArrowLeft size={16} />
          Back to all goals
        </Link>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white">
              <div className="bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.12),_transparent_42%),linear-gradient(135deg,#fff7ed,_#ffffff_55%,#f8fafc)] p-8">
                {isLoading || !goal ? (
                  <div className="text-sm text-slate-500">Loading goal...</div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Shopping Plan
                      </span>
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                        Suggested budget {formatCurrency(goal.suggestedBudget)}
                      </span>
                    </div>
                    <h1 className="mt-4 text-4xl font-semibold text-slate-950">
                      {goal.title}
                    </h1>
                    <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                      {goal.description}
                    </p>
                    <p className="mt-3 text-sm text-slate-500">{goal.audience}</p>
                  </>
                )}
              </div>

              {goal ? (
                <div className="grid gap-4 border-t border-slate-200 p-6 md:grid-cols-3">
                  {goal.steps.map((step: any) => (
                    <div key={step.key} className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        {step.label}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-slate-700">
                        {step.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            {savedBundles.length ? (
              <section className="rounded-[2rem] border border-slate-200 bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Saved bundles
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                      Revisit or compare previous plans
                    </h2>
                  </div>
                  <p className="text-sm text-slate-500">
                    Pick an older bundle to reload its brief and compare totals.
                  </p>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  {savedBundles.map((savedBundle: any) => {
                    const isComparing = comparisonBundleId === savedBundle.id;

                    return (
                      <div
                        key={savedBundle.id}
                        className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-semibold text-slate-900">
                              {savedBundle.name || goal?.title}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {new Date(savedBundle.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                            {formatCurrency(savedBundle.total)}
                          </span>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-2xl bg-white p-3">
                            <p className="text-slate-500">Budget</p>
                            <p className="mt-1 font-semibold text-slate-900">
                              {formatCurrency(savedBundle.budget)}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-white p-3">
                            <p className="text-slate-500">Remaining</p>
                            <p className="mt-1 font-semibold text-slate-900">
                              {formatCurrency(savedBundle.remainingBudget)}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-white p-3">
                            <p className="text-slate-500">Coverage</p>
                            <p className="mt-1 font-semibold text-slate-900">
                              {savedBundle.completionRate?.toFixed?.(0) || 0}%
                            </p>
                          </div>
                          <div className="rounded-2xl bg-white p-3">
                            <p className="text-slate-500">Budget use</p>
                            <p className="mt-1 font-semibold text-slate-900">
                              {savedBundle.budgetUtilization?.toFixed?.(0) || 0}%
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            onClick={() => void handleLoadBundle(savedBundle)}
                            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                          >
                            Load bundle
                          </button>
                          <button
                            onClick={() =>
                              setComparisonBundleId(isComparing ? "" : savedBundle.id)
                            }
                            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
                          >
                            {isComparing ? "Stop comparing" : "Compare"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {bundle && comparisonBundle && smartComparison ? (
                  <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Smart bundle comparison
                        </p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900">
                          {smartComparison.verdict}
                        </h3>
                      </div>
                      <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        Current {smartComparison.currentWins} / Saved{" "}
                        {smartComparison.savedWins} / Ties {smartComparison.ties}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Current bundle
                        </p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">
                          {bundle.name || goal?.title}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">
                          {formatCurrency(bundle.total)} total with{" "}
                          {formatCurrency(bundle.remainingBudget)} left.
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Saved bundle
                        </p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">
                          {comparisonBundle.name || goal?.title}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">
                          {formatCurrency(comparisonBundle.total)} total with{" "}
                          {formatCurrency(comparisonBundle.remainingBudget)} left.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                      {smartComparison.rows.map((row) => (
                        <div
                          key={row.label}
                          className="grid grid-cols-[1.2fr_0.9fr_0.9fr_0.8fr] gap-3 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0"
                        >
                          <p className="font-medium text-slate-700">{row.label}</p>
                          <p className="text-slate-600">{row.currentDisplay}</p>
                          <p className="text-slate-600">{row.savedDisplay}</p>
                          <p className="font-semibold text-slate-900">
                            {row.winner === "tie"
                              ? "Tie"
                              : row.winner === "current"
                                ? "Current"
                                : "Saved"}
                          </p>
                        </div>
                      ))}
                    </div>

                    {smartComparison.notes.length ? (
                      <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
                        <p className="font-semibold">What stands out</p>
                        <div className="mt-2 space-y-1">
                          {smartComparison.notes.map((note) => (
                            <p key={note}>{note}</p>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </section>
            ) : null}

            {bundle?.items?.length ? (
              <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Bundle editor
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                      Tune each step before you buy
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => void handleCopyBundleSummary()}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
                    >
                      <CopyPlus size={16} />
                      Copy summary
                    </button>
                    <button
                      onClick={handleShareBundle}
                      disabled={isSharingBundle}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      <Share2 size={16} />
                      {isSharingBundle ? "Sharing..." : "Turn into shared cart"}
                    </button>
                  </div>
                </div>

                <div className="grid gap-4">
                  {bundle.items.map((item: any) => {
                    const isLocked = lockedStepKeys.includes(item.stepKey);

                    return (
                      <div
                        key={item.stepKey}
                        className="rounded-[2rem] border border-slate-200 bg-white p-6"
                      >
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                          <div className="max-w-2xl">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                {item.stepLabel}
                              </span>
                              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                {formatCurrency(item.variantPrice)}
                              </span>
                              <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                                Allocated {formatCurrency(item.allocatedBudget)}
                              </span>
                              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                                {item.confidenceLabel} • {item.confidenceScore}%
                              </span>
                            </div>
                            <h3 className="mt-4 text-2xl font-semibold text-slate-900">
                              {item.productName}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {item.stepDescription}
                            </p>
                            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                              <p className="font-semibold text-slate-900">
                                Why this pick works
                              </p>
                              <p className="mt-2 leading-6">{item.selectionReason}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleToggleLock(item.stepKey)}
                              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                                isLocked
                                  ? "bg-slate-900 text-white hover:bg-slate-800"
                                  : "border border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                              }`}
                            >
                              {isLocked ? <Lock size={16} /> : <LockOpen size={16} />}
                              {isLocked ? "Locked" : "Lock this step"}
                            </button>
                            <button
                              onClick={() =>
                                void handleAssemble({
                                  regenerateStepKeys: [item.stepKey],
                                })
                              }
                              disabled={isAssembling}
                              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <RefreshCcw size={16} />
                              Regenerate just this step
                            </button>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3 md:grid-cols-3">
                          {(item.alternatives || []).map((alternative: any) => {
                            const isSelected =
                              alternative.variantId === item.variantId;

                            return (
                              <button
                                key={alternative.variantId}
                                onClick={() =>
                                  !isSelected &&
                                  void handleSwapVariant(
                                    item.stepKey,
                                    alternative.variantId
                                  )
                                }
                                className={`rounded-3xl border p-4 text-left transition ${
                                  isSelected
                                    ? "border-slate-900 bg-slate-900 text-white"
                                    : "border-slate-200 bg-slate-50 hover:border-slate-400"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold">
                                      {alternative.productName}
                                    </p>
                                    <p
                                      className={`mt-1 text-xs ${
                                        isSelected
                                          ? "text-slate-300"
                                          : "text-slate-500"
                                      }`}
                                    >
                                      {alternative.categoryName}
                                    </p>
                                  </div>
                                  {isSelected ? (
                                    <CheckCircle2 size={18} />
                                  ) : null}
                                </div>
                                <p className="mt-3 text-sm font-semibold">
                                  {formatCurrency(alternative.variantPrice)}
                                </p>
                                <p
                                  className={`mt-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                                    isSelected
                                      ? "text-amber-200"
                                      : "text-amber-700"
                                  }`}
                                >
                                  {alternative.confidenceLabel} • {alternative.confidenceScore}%
                                </p>
                                <p
                                  className={`mt-3 text-sm leading-6 ${
                                    isSelected
                                      ? "text-slate-200"
                                      : "text-slate-600"
                                  }`}
                                >
                                  {alternative.selectionReason}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="xl:sticky xl:top-24 xl:self-start">
            <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.28)]">
              <div className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-slate-300">
                Plan details
              </div>
              <h2 className="mt-4 text-2xl font-semibold">
                Build a plan that fits
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Tell us who this is for, what matters most, and what to avoid.
                You can edit every step before saving or checking out.
              </p>

              <div className="mt-6 grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    value={brief.whoFor}
                    onChange={(event) =>
                      setBrief((current) => ({
                        ...current,
                        whoFor: event.target.value,
                      }))
                    }
                    placeholder="Who is this for?"
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                  />
                  <input
                    value={brief.occasion}
                    onChange={(event) =>
                      setBrief((current) => ({
                        ...current,
                        occasion: event.target.value,
                      }))
                    }
                    placeholder="What is the moment?"
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    value={brief.deadline}
                    onChange={(event) =>
                      setBrief((current) => ({
                        ...current,
                        deadline: event.target.value,
                      }))
                    }
                    placeholder="Deadline or trip date"
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                  />
                  <input
                    value={brief.style}
                    onChange={(event) =>
                      setBrief((current) => ({
                        ...current,
                        style: event.target.value,
                      }))
                    }
                    placeholder="Style or vibe"
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                  />
                </div>

                <input
                  value={brief.mustHaves}
                  onChange={(event) =>
                    setBrief((current) => ({
                      ...current,
                      mustHaves: event.target.value,
                    }))
                  }
                  placeholder="Must-haves, comma separated"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                />
                <input
                  value={brief.avoidList}
                  onChange={(event) =>
                    setBrief((current) => ({
                      ...current,
                      avoidList: event.target.value,
                    }))
                  }
                  placeholder="Avoid list, comma separated"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                />
                <textarea
                  value={brief.notes}
                  onChange={(event) =>
                    setBrief((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Anything else the bundle should optimize for?"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    type="number"
                    value={brief.budgetMin}
                    onChange={(event) =>
                      setBrief((current) => ({
                        ...current,
                        budgetMin: event.target.value,
                      }))
                    }
                    placeholder="Budget floor"
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                  />
                  <input
                    type="number"
                    value={brief.budgetMax}
                    onChange={(event) =>
                      setBrief((current) => ({
                        ...current,
                        budgetMax: event.target.value,
                      }))
                    }
                    placeholder="Budget ceiling"
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-white">
                    Working budget
                  </label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(event) => {
                      const nextValue = Number(event.target.value);
                      setBudget(Number.isFinite(nextValue) ? nextValue : "");
                    }}
                    placeholder={goal ? String(goal.suggestedBudget) : "500"}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                  />
                </div>
              </div>

              <button
                onClick={() => void handleAssemble()}
                disabled={!goal || isAssembling}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Target size={16} />
                {isAssembling ? "Building your plan..." : "Build my goal bundle"}
              </button>

              {bundle ? (
                <div className="mt-6 space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Bundle total
                      </p>
                      <p className="mt-2 text-2xl font-semibold">
                        {formatCurrency(bundle.total)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Budget left
                      </p>
                      <p className="mt-2 text-2xl font-semibold">
                        {formatCurrency(bundle.remainingBudget)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-black/20 p-4 sm:col-span-2">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Confidence
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <p className="text-2xl font-semibold">
                          {bundle.confidenceScore || 0}%
                        </p>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">
                          {bundle.confidenceLabel || "Draft"}
                        </span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-amber-400"
                          style={{ width: `${bundle.confidenceScore || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {bundle.missedSteps?.length ? (
                    <div className="rounded-2xl bg-amber-500/10 p-4 text-sm text-amber-100">
                      <div className="flex items-center gap-2 font-semibold">
                        <Clock3 size={16} />
                        Still missing
                      </div>
                      <p className="mt-2 leading-6">
                        {bundle.missedSteps.join(", ")}
                      </p>
                    </div>
                  ) : null}

                  <button
                    onClick={handleApplyToCart}
                    disabled={isApplyingBundle}
                    className="w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-emerald-200"
                  >
                    {isApplyingBundle ? "Adding to cart..." : "Attach bundle to cart"}
                  </button>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </MainLayout>
  );
};

export default GoalDetailPage;
