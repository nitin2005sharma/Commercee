"use client";

import MainLayout from "@/app/components/templates/MainLayout";
import useToast from "@/app/hooks/ui/useToast";
import {
  useApplyGoalBundleToCartMutation,
  useAssembleCustomBundleMutation,
  useGetFrequentBundlesQuery,
  useGetGoalBundlesQuery,
  useShareGoalBundleMutation,
} from "@/app/store/apis/GoalApi";
import { buildSmartBundleComparison } from "@/app/utils/smartBundleComparison";
import {
  ArrowLeft,
  CheckCircle2,
  CopyPlus,
  Lock,
  LockOpen,
  Plus,
  RefreshCcw,
  Share2,
  Target,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const formatCurrency = (value?: number) =>
  typeof value === "number" ? `$${value.toFixed(2)}` : "$0.00";

const emptyItem = () => ({
  key: "",
  label: "",
  description: "",
  quantity: 1,
  keywords: "",
  categoryNames: "",
  priority: "MEDIUM",
  targetBudget: "",
});

const CustomBundlesPage = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const { data: bundlesData } = useGetGoalBundlesQuery(undefined);
  const { data: frequentData } = useGetFrequentBundlesQuery(6);
  const [assembleCustomBundle, { isLoading: isAssembling }] =
    useAssembleCustomBundleMutation();
  const [applyGoalBundleToCart, { isLoading: isApplyingBundle }] =
    useApplyGoalBundleToCartMutation();
  const [shareGoalBundle, { isLoading: isSharingBundle }] =
    useShareGoalBundleMutation();

  const [brief, setBrief] = useState({
    name: "",
    requestText: "",
    style: "",
    avoidList: "",
    notes: "",
  });
  const [budget, setBudget] = useState<number | "">("");
  const [requestedItems, setRequestedItems] = useState([emptyItem(), emptyItem()]);
  const [bundle, setBundle] = useState<any>(null);
  const [comparisonBundleId, setComparisonBundleId] = useState<string>("");
  const [lockedItemKeys, setLockedItemKeys] = useState<string[]>([]);

  const savedCustomBundles = useMemo(() => {
    return (bundlesData?.bundles || []).filter(
      (entry: any) => entry.bundleType === "CUSTOM"
    );
  }, [bundlesData?.bundles]);

  const frequentBundles = frequentData?.bundles || [];
  const comparisonBundle =
    savedCustomBundles.find((entry: any) => entry.id === comparisonBundleId) || null;
  const smartComparison = useMemo(() => {
    if (!bundle || !comparisonBundle) {
      return null;
    }

    return buildSmartBundleComparison(bundle, comparisonBundle, {
      currentLockedKeys: lockedItemKeys,
      formatCurrency,
    });
  }, [bundle, comparisonBundle, lockedItemKeys]);

  const handleItemChange = (index: number, field: string, value: string | number) => {
    setRequestedItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  };

  const buildPayload = () => ({
    name: brief.name.trim() || undefined,
    requestText: brief.requestText.trim() || undefined,
    style: brief.style.trim() || undefined,
    avoidList: brief.avoidList
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
    notes: brief.notes.trim() || undefined,
    items: requestedItems
      .filter((item) => item.label.trim())
      .map((item, index) => ({
        key: item.key.trim() || `custom-item-${index + 1}`,
        label: item.label.trim(),
        description: item.description.trim() || undefined,
        quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1,
        keywords: item.keywords
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean),
        categoryNames: item.categoryNames
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean),
        priority: item.priority as "HIGH" | "MEDIUM" | "LOW",
        targetBudget: item.targetBudget ? Number(item.targetBudget) : undefined,
      })),
  });

  const handleAssemble = async (options?: {
    bundleId?: string;
    regenerateItemKeys?: string[];
    selectedVariants?: Record<string, string>;
    nextLockedItemKeys?: string[];
  }) => {
    try {
      const nextLockedItemKeys = options?.nextLockedItemKeys || lockedItemKeys;
      const result = await assembleCustomBundle({
        budget: typeof budget === "number" && budget > 0 ? budget : undefined,
        brief: buildPayload(),
        bundleId: options?.bundleId || bundle?.id,
        regenerateItemKeys: options?.regenerateItemKeys,
        selectedVariants: options?.selectedVariants,
        lockedItemKeys: nextLockedItemKeys,
      }).unwrap();

      setBundle(result.bundle);
      setLockedItemKeys(nextLockedItemKeys);
    } catch (error: any) {
      const message =
        error?.data?.message || error?.message || "Could not build this custom bundle";
      showToast(message, "error");
    }
  };

  const loadSavedBundle = async (savedBundle: any) => {
    setBrief({
      name: savedBundle.brief?.name || savedBundle.name || "",
      requestText: savedBundle.brief?.requestText || "",
      style: savedBundle.brief?.style || "",
      avoidList: (savedBundle.brief?.avoidList || []).join(", "),
      notes: savedBundle.brief?.notes || "",
    });
    setBudget(savedBundle.budget || "");
    setRequestedItems(
      (savedBundle.brief?.items || []).length
        ? (savedBundle.brief.items || []).map((item: any, index: number) => ({
            key: item.key || `custom-item-${index + 1}`,
            label: item.label || "",
            description: item.description || "",
            quantity: item.quantity || 1,
            keywords: (item.keywords || []).join(", "),
            categoryNames: (item.categoryNames || []).join(", "),
            priority: item.priority || "MEDIUM",
            targetBudget: item.targetBudget ? String(item.targetBudget) : "",
          }))
        : [emptyItem()]
    );

    await handleAssemble({
      bundleId: savedBundle.id,
      nextLockedItemKeys: (savedBundle.items || [])
        .filter((item: any) => item.locked)
        .map((item: any) => item.stepKey),
    });
  };

  const handleSwapVariant = async (itemKey: string, variantId: string) => {
    await handleAssemble({
      selectedVariants: { [itemKey]: variantId },
      regenerateItemKeys: [itemKey],
    });
  };

  const handleToggleLock = (itemKey: string) => {
    setLockedItemKeys((current) =>
      current.includes(itemKey)
        ? current.filter((entry) => entry !== itemKey)
        : [...current, itemKey]
    );
  };

  const handleApplyToCart = async () => {
    if (!bundle?.id) {
      return;
    }

    try {
      await applyGoalBundleToCart(bundle.id).unwrap();
      showToast("Custom bundle attached to your cart", "success");
    } catch (error: any) {
      const message =
        error?.data?.message ||
        error?.message ||
        "Could not attach this bundle to the cart";
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
      showToast("Shared cart created from this custom bundle", "success");
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
      bundle.name || "Custom bundle",
      `Budget: ${formatCurrency(bundle.budget)}`,
      `Total: ${formatCurrency(bundle.total)}`,
      ...bundle.items.map(
        (item: any) =>
          `${item.stepLabel} x${item.quantity}: ${item.productName} (${formatCurrency(
            item.variantPrice * item.quantity
          )})`
      ),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(summary);
      showToast("Bundle summary copied", "success");
    } catch {
      showToast("Could not copy the bundle summary", "error");
    }
  };

  const seedFromFrequentBundle = (suggestion: any) => {
    setBrief({
      name: suggestion.title,
      requestText: suggestion.items.map((item: any) => item.productName).join(", "),
      style: "",
      avoidList: "",
      notes: `Seeded from a frequently bought bundle suggestion.`,
    });
    setBudget(suggestion.total || "");
    setRequestedItems(
      (suggestion.items || []).map((item: any, index: number) => ({
        key: `frequent-item-${index + 1}`,
        label: item.productName,
        description: item.stepDescription || "",
        quantity: item.quantity || 1,
        keywords: item.productName,
        categoryNames: item.categoryName || "",
        priority: "MEDIUM",
        targetBudget: item.variantPrice ? String(item.variantPrice * (item.quantity || 1)) : "",
      }))
    );
    setBundle(null);
    setLockedItemKeys([]);
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <Link
          href="/goals"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600"
        >
          <ArrowLeft size={16} />
          Back to curated goals
        </Link>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white">
              <div className="bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_38%),linear-gradient(135deg,#ecfeff,_#ffffff_55%,#f8fafc)] p-8">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Custom Bundle
                  </span>
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                    Build it your way
                  </span>
                </div>
                <h1 className="mt-4 text-4xl font-semibold text-slate-950">
                  Add the items you need, then compare a few matching products.
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                  Use this when you already know the kind of items you want, but
                  still want help choosing the exact products.
                </p>
                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  <div className="rounded-3xl bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Your list
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-700">
                      Name the bundle, describe the need, and define each item you
                      want inside it.
                    </p>
                  </div>
                  <div className="rounded-3xl bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Editable
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-700">
                      Lock one item, swap another, regenerate only what still feels weak.
                    </p>
                  </div>
                  <div className="rounded-3xl bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Reusable
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-700">
                      Save it, attach it to cart, or turn it into a shared decision flow.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {frequentBundles.length ? (
              <section className="rounded-[2rem] border border-slate-200 bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Most frequently bought bundles
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                      Use common buying patterns as a starting point
                    </h2>
                  </div>
                  <p className="text-sm text-slate-500">
                    Seed your own bundle from what shoppers often buy together.
                  </p>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  {frequentBundles.map((suggestion: any) => (
                    <div
                      key={suggestion.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-slate-900">
                            {suggestion.title}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {suggestion.summary}
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                          {formatCurrency(suggestion.total)}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {(suggestion.items || []).map((item: any) => (
                          <span
                            key={item.variantId}
                            className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700"
                          >
                            {item.productName} x{item.quantity}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => seedFromFrequentBundle(suggestion)}
                        className="mt-5 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        Use as a starting point
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {savedCustomBundles.length ? (
              <section className="rounded-[2rem] border border-slate-200 bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Saved custom bundles
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                      Reopen your own bundle drafts
                    </h2>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  {savedCustomBundles.map((savedBundle: any) => {
                    const isComparing = comparisonBundleId === savedBundle.id;

                    return (
                      <div
                        key={savedBundle.id}
                        className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                      >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-slate-900">
                            {savedBundle.name || "Custom bundle"}
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
                          <p className="text-slate-500">Items</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {savedBundle.items?.length || 0}
                          </p>
                        </div>
                      </div>
                      <div className="mt-5 flex flex-wrap gap-2">
                        <button
                          onClick={() => void loadSavedBundle(savedBundle)}
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
                          {bundle.name || "Current custom bundle"}
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
                          {comparisonBundle.name || "Saved custom bundle"}
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
                      Custom bundle editor
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                      Tune each requested item before you buy
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
                    const isLocked = lockedItemKeys.includes(item.stepKey);

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
                                {formatCurrency(item.variantPrice * item.quantity)}
                              </span>
                              <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                                Qty {item.quantity}
                              </span>
                              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                                {item.confidenceLabel} - {item.confidenceScore}%
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
                              {isLocked ? "Locked" : "Lock this item"}
                            </button>
                            <button
                              onClick={() =>
                                void handleAssemble({
                                  regenerateItemKeys: [item.stepKey],
                                })
                              }
                              disabled={isAssembling}
                              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <RefreshCcw size={16} />
                              Regenerate just this item
                            </button>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3 md:grid-cols-3">
                          {(item.alternatives || []).map((alternative: any) => {
                            const isSelected = alternative.variantId === item.variantId;

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
                                        isSelected ? "text-slate-300" : "text-slate-500"
                                      }`}
                                    >
                                      {alternative.categoryName}
                                    </p>
                                  </div>
                                  {isSelected ? <CheckCircle2 size={18} /> : null}
                                </div>
                                <p className="mt-3 text-sm font-semibold">
                                  {formatCurrency(alternative.variantPrice * item.quantity)}
                                </p>
                                <p
                                  className={`mt-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                                    isSelected ? "text-amber-200" : "text-amber-700"
                                  }`}
                                >
                                  {alternative.confidenceLabel} - {alternative.confidenceScore}%
                                </p>
                                <p
                                  className={`mt-3 text-sm leading-6 ${
                                    isSelected ? "text-slate-200" : "text-slate-600"
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
                Bundle request
              </div>
              <h2 className="mt-4 text-2xl font-semibold">
                Build your own bundle
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Add the items you want, the quantity, and any budget or style
                notes. We will turn that into a saved bundle you can edit.
              </p>

              <div className="mt-6 grid gap-4">
                <input
                  value={brief.name}
                  onChange={(event) =>
                    setBrief((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Bundle name"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                />
                <textarea
                  value={brief.requestText}
                  onChange={(event) =>
                    setBrief((current) => ({
                      ...current,
                      requestText: event.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Freeform request, for example: shoes, jacket, and a weekend bag"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    value={brief.style}
                    onChange={(event) =>
                      setBrief((current) => ({ ...current, style: event.target.value }))
                    }
                    placeholder="Style or vibe"
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                  />
                  <input
                    type="number"
                    value={budget}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      setBudget(Number.isFinite(value) ? value : "");
                    }}
                    placeholder="Bundle budget"
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                  />
                </div>
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
                    setBrief((current) => ({ ...current, notes: event.target.value }))
                  }
                  rows={3}
                  placeholder="Extra bundle notes"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                />

                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">Requested items</p>
                    <button
                      onClick={() =>
                        setRequestedItems((current) => [...current, emptyItem()])
                      }
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                    >
                      <Plus size={14} />
                      Add item
                    </button>
                  </div>

                  <div className="mt-4 space-y-4">
                    {requestedItems.map((item, index) => (
                      <div
                        key={`${item.key || "row"}-${index}`}
                        className="rounded-3xl border border-white/10 bg-black/20 p-4"
                      >
                        <div className="grid gap-3">
                          <div className="grid gap-3 sm:grid-cols-[1.4fr_0.6fr]">
                            <input
                              value={item.label}
                              onChange={(event) =>
                                handleItemChange(index, "label", event.target.value)
                              }
                              placeholder="Item name, for example running shoes"
                              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                            />
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(event) =>
                                handleItemChange(
                                  index,
                                  "quantity",
                                  Number(event.target.value) || 1
                                )
                              }
                              placeholder="Qty"
                              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                            />
                          </div>

                          <input
                            value={item.description}
                            onChange={(event) =>
                              handleItemChange(index, "description", event.target.value)
                            }
                            placeholder="What should this item do in the bundle?"
                            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                          />

                          <div className="grid gap-3 sm:grid-cols-2">
                            <input
                              value={item.keywords}
                              onChange={(event) =>
                                handleItemChange(index, "keywords", event.target.value)
                              }
                              placeholder="Keywords, comma separated"
                              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                            />
                            <input
                              value={item.categoryNames}
                              onChange={(event) =>
                                handleItemChange(index, "categoryNames", event.target.value)
                              }
                              placeholder="Categories, comma separated"
                              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                            />
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <select
                              value={item.priority}
                              onChange={(event) =>
                                handleItemChange(index, "priority", event.target.value)
                              }
                              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                            >
                              <option value="HIGH">High priority</option>
                              <option value="MEDIUM">Medium priority</option>
                              <option value="LOW">Low priority</option>
                            </select>
                            <input
                              type="number"
                              value={item.targetBudget}
                              onChange={(event) =>
                                handleItemChange(index, "targetBudget", event.target.value)
                              }
                              placeholder="Target budget for this item"
                              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                            />
                          </div>

                          {requestedItems.length > 1 ? (
                            <button
                              onClick={() =>
                                setRequestedItems((current) =>
                                  current.filter((_, itemIndex) => itemIndex !== index)
                                )
                              }
                              className="inline-flex items-center gap-2 text-sm font-semibold text-rose-200"
                            >
                              <Trash2 size={14} />
                              Remove item
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => void handleAssemble()}
                disabled={isAssembling}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Target size={16} />
                {isAssembling ? "Building your bundle..." : "Build my custom bundle"}
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
                      <p className="font-semibold">Still missing</p>
                      <p className="mt-2 leading-6">{bundle.missedSteps.join(", ")}</p>
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

export default CustomBundlesPage;
