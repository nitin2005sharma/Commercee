"use client";

import useToast from "@/app/hooks/ui/useToast";
import {
  useGetOrderGoalSuccessQuery,
  useSubmitOrderGoalSuccessMutation,
} from "@/app/store/apis/OrderApi";
import {
  CheckCircle2,
  CircleDashed,
  Flag,
  MessageCircleHeart,
  Target,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const STATUS_OPTIONS = [
  {
    value: "SUCCESS",
    label: "Yes, fully",
    description: "This step worked well.",
  },
  {
    value: "PARTIAL",
    label: "Partially",
    description: "Some parts worked, but not everything.",
  },
  {
    value: "FAILED",
    label: "Not yet",
    description: "This stage is blocking the result right now.",
  },
  {
    value: "SKIPPED",
    label: "Skip for now",
    description: "Come back to this checkpoint later.",
  },
];

const STEP_STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "ACHIEVED", label: "Achieved" },
  { value: "PARTIAL", label: "Partial" },
  { value: "MISSED", label: "Missed" },
  { value: "NOT_APPLICABLE", label: "N/A" },
];

const REASON_OPTIONS = [
  { value: "MISSING_ITEM", label: "Missing item or step" },
  { value: "FIT", label: "Fit issue" },
  { value: "QUALITY", label: "Quality mismatch" },
  { value: "SETUP", label: "Setup was harder than expected" },
  { value: "DELIVERY", label: "Delivery problem" },
  { value: "BUDGET", label: "Budget regret" },
  { value: "STYLE", label: "Style or preference mismatch" },
  { value: "WRONG_MATCH", label: "The recommendation was wrong" },
  { value: "OTHER", label: "Other" },
];

const STATUS_STYLES: Record<string, string> = {
  SUCCESS: "border-emerald-200 bg-emerald-50 text-emerald-900",
  PARTIAL: "border-amber-200 bg-amber-50 text-amber-900",
  FAILED: "border-rose-200 bg-rose-50 text-rose-900",
  SKIPPED: "border-slate-200 bg-slate-50 text-slate-700",
  PENDING: "border-slate-200 bg-slate-50 text-slate-700",
};

const STATUS_LABELS: Record<string, string> = {
  SUCCESS: "Worked well",
  PARTIAL: "Partly worked",
  FAILED: "Needs recovery",
  SKIPPED: "Saved for later",
  PENDING: "Not started",
};

const GoalSuccessTrackerCard = ({ order }: { order: any }) => {
  const { showToast } = useToast();
  const { data, isLoading } = useGetOrderGoalSuccessQuery(order.id);
  const [submitGoalSuccess, { isLoading: isSaving }] =
    useSubmitOrderGoalSuccessMutation();

  const goalSuccess = data?.goalSuccess;
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [satisfactionScore, setSatisfactionScore] = useState<number>(4);
  const [primaryReason, setPrimaryReason] = useState("");
  const [notes, setNotes] = useState("");
  const [stages, setStages] = useState<any[]>([]);

  useEffect(() => {
    if (!goalSuccess) {
      return;
    }

    setSelectedGoalId(
      goalSuccess.checkin?.goalTemplateId ||
        goalSuccess.selectedGoalTemplate?.id ||
        goalSuccess.recommendedGoals?.[0]?.id ||
        ""
    );
    setStatus(goalSuccess.checkin?.status || "PENDING");
    setSatisfactionScore(goalSuccess.checkin?.satisfactionScore || 4);
    setPrimaryReason(goalSuccess.checkin?.primaryReason || "");
    setNotes(goalSuccess.checkin?.notes || "");
    setStages(goalSuccess.stages || []);
  }, [goalSuccess]);

  const selectedGoal =
    goalSuccess?.recommendedGoals?.find((goal: any) => goal.id === selectedGoalId) ||
    goalSuccess?.selectedGoalTemplate ||
    null;

  const needsReason = status === "PARTIAL" || status === "FAILED";
  const supportSearchParams = new URLSearchParams({
    orderId: order.id,
    goalStatus: status,
  });

  if (primaryReason) {
    supportSearchParams.set("goalReason", primaryReason);
  }

  if (selectedGoalId) {
    supportSearchParams.set("goalTemplateId", selectedGoalId);
  }

  const supportHref = `/support?${supportSearchParams.toString()}`;

  const updateStage = (stageKey: string, updater: (stage: any) => any) => {
    setStages((current) =>
      current.map((stage) => (stage.stage === stageKey ? updater(stage) : stage))
    );
  };

  const handleSubmit = async () => {
    try {
      await submitGoalSuccess({
        orderId: order.id,
        goalTemplateId: selectedGoalId || undefined,
        status,
        satisfactionScore,
        primaryReason: needsReason ? primaryReason || undefined : undefined,
        notes: notes.trim() || undefined,
        stages: stages.map((stage) => ({
          stage: stage.stage,
          status: stage.status,
          satisfactionScore: stage.satisfactionScore || undefined,
          primaryReason:
            stage.status === "PARTIAL" || stage.status === "FAILED"
              ? stage.primaryReason || undefined
              : undefined,
          notes: stage.notes?.trim() || undefined,
          steps: (stage.steps || []).map((step: any) => ({
            stepKey: step.stepKey,
            stepLabel: step.stepLabel,
            status: step.status,
            notes: step.notes?.trim() || undefined,
          })),
        })),
      }).unwrap();

      showToast("Goal success check-in saved", "success");
    } catch (error: any) {
      const message =
        error?.data?.message ||
        error?.message ||
        "Could not save goal success feedback";
      showToast(message, "error");
    }
  };

  if (isLoading && !goalSuccess) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-sm text-slate-500">Loading order check-in...</div>
      </div>
    );
  }

  if (!goalSuccess) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-slate-400">
        <Target size={16} />
        Order Check-In
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-semibold text-slate-900">
          Did this order work for what you needed?
        </h2>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status] || STATUS_STYLES.PENDING}`}
        >
          {STATUS_LABELS[status] || "Saved"}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">{goalSuccess.summary}</p>

      {goalSuccess.selectedBundle ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">
            Bundle: {goalSuccess.selectedBundle.name || "Saved plan"}
          </p>
          <p className="mt-2 leading-6">
            Planned total ${goalSuccess.selectedBundle.total?.toFixed(2)} with{" "}
            ${goalSuccess.selectedBundle.remainingBudget?.toFixed(2)} left in the original
            budget.
          </p>
        </div>
      ) : null}

      {goalSuccess.recommendedGoals?.length ? (
        <div className="mt-6 rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            Related plans
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {goalSuccess.recommendedGoals.map((goal: any) => (
              <button
                key={goal.id}
                onClick={() => setSelectedGoalId(goal.id)}
                className={`rounded-full border px-3 py-2 text-sm transition ${
                  selectedGoalId === goal.id
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                }`}
              >
                {goal.title}
                <span className="ml-2 text-xs opacity-75">{goal.score}%</span>
              </button>
            ))}
          </div>
          {selectedGoal ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">{selectedGoal.title}</p>
              <p className="mt-2 leading-6">
                {selectedGoal.whyItFits || selectedGoal.description}
              </p>
            </div>
          ) : null}
          {goalSuccess.recoverySteps?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {goalSuccess.recoverySteps.map((step: any) => (
                <span
                  key={step.key}
                  className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900"
                >
                  Recover {step.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Flag size={16} />
            Overall result
          </div>
          <div className="mt-3 grid gap-2">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setStatus(option.value)}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  status === option.value
                    ? "border-slate-900 bg-white"
                    : "border-transparent bg-white/60 hover:border-slate-200"
                }`}
              >
                <p className="text-sm font-semibold text-slate-900">
                  {option.label}
                </p>
                <p className="mt-1 text-sm text-slate-600">{option.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <MessageCircleHeart size={16} />
            Confidence and notes
          </div>
          <p className="mt-3 text-sm text-slate-600">
            How well did this order work overall?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                onClick={() => setSatisfactionScore(score)}
                className={`h-10 w-10 rounded-full border text-sm font-semibold transition ${
                  satisfactionScore === score
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                {score}
              </button>
            ))}
          </div>

          {needsReason ? (
            <div className="mt-4">
              <label className="text-sm font-medium text-slate-900">
                What held the overall result back?
              </label>
              <select
                value={primaryReason}
                onChange={(event) => setPrimaryReason(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              >
                <option value="">Select a reason</option>
                {REASON_OPTIONS.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="mt-4">
            <label className="text-sm font-medium text-slate-900">
              Overall note
            </label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="What worked, what felt off, or what still needs to happen?"
              className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {stages.map((stage: any) => {
          const stageNeedsReason =
            stage.status === "PARTIAL" || stage.status === "FAILED";

          return (
            <div
              key={stage.stage}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {stage.label}
                    </span>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        STATUS_STYLES[stage.status] || STATUS_STYLES.PENDING
                      }`}
                    >
                      {STATUS_LABELS[stage.status] || "Not started"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {stage.description}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Suggested check-in by{" "}
                    {stage.dueAt ? new Date(stage.dueAt).toLocaleDateString() : "later"}
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {STATUS_OPTIONS.map((option) => (
                    <button
                      key={`${stage.stage}-${option.value}`}
                      onClick={() =>
                        updateStage(stage.stage, (current) => ({
                          ...current,
                          status: option.value,
                        }))
                      }
                      className={`rounded-2xl border px-3 py-2 text-left text-sm transition ${
                        stage.status === option.value
                          ? "border-slate-900 bg-white"
                          : "border-transparent bg-white/70 hover:border-slate-200"
                      }`}
                    >
                      <p className="font-semibold text-slate-900">{option.label}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {option.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Stage confidence
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={`${stage.stage}-${score}`}
                        onClick={() =>
                          updateStage(stage.stage, (current) => ({
                            ...current,
                            satisfactionScore: score,
                          }))
                        }
                        className={`h-10 w-10 rounded-full border text-sm font-semibold transition ${
                          stage.satisfactionScore === score
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Stage note
                  </p>
                  {stageNeedsReason ? (
                    <select
                      value={stage.primaryReason || ""}
                      onChange={(event) =>
                        updateStage(stage.stage, (current) => ({
                          ...current,
                          primaryReason: event.target.value,
                        }))
                      }
                      className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                    >
                      <option value="">Select a reason</option>
                      {REASON_OPTIONS.map((reason) => (
                        <option key={reason.value} value={reason.value}>
                          {reason.label}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  <textarea
                    value={stage.notes || ""}
                    onChange={(event) =>
                      updateStage(stage.stage, (current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    placeholder="What happened in this stage?"
                    className="mt-3 min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </div>
              </div>

              {stage.steps?.length ? (
                <div className="mt-4 grid gap-3">
                  {stage.steps.map((step: any) => (
                    <div
                      key={`${stage.stage}-${step.stepKey}`}
                      className="rounded-2xl bg-white p-4"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-xl">
                          <p className="font-semibold text-slate-900">
                            {step.stepLabel}
                          </p>
                          {step.description ? (
                            <p className="mt-1 text-sm leading-6 text-slate-600">
                              {step.description}
                            </p>
                          ) : null}
                        </div>
                        <select
                          value={step.status}
                          onChange={(event) =>
                            updateStage(stage.stage, (current) => ({
                              ...current,
                              steps: current.steps.map((currentStep: any) =>
                                currentStep.stepKey === step.stepKey
                                  ? {
                                      ...currentStep,
                                      status: event.target.value,
                                    }
                                  : currentStep
                              ),
                            }))
                          }
                          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                        >
                          {STEP_STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <textarea
                        value={step.notes || ""}
                        onChange={(event) =>
                          updateStage(stage.stage, (current) => ({
                            ...current,
                            steps: current.steps.map((currentStep: any) =>
                              currentStep.stepKey === step.stepKey
                                ? {
                                    ...currentStep,
                                    notes: event.target.value,
                                  }
                                : currentStep
                            ),
                          }))
                        }
                        placeholder="Optional step-specific note"
                        className="mt-3 min-h-20 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={handleSubmit}
          disabled={isSaving || (needsReason && !primaryReason)}
          className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSaving
            ? "Saving..."
            : goalSuccess.checkin?.id
              ? "Update check-in"
              : "Save check-in"}
        </button>
        <Link
          href={supportHref}
          className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Need help right now?
        </Link>
      </div>

      {goalSuccess.interventions?.length ? (
        <div className="mt-6 grid gap-3">
          {goalSuccess.interventions.map((intervention: any) => (
            <div
              key={intervention.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-start gap-3">
                {intervention.type === "REVIEW" ? (
                  <CheckCircle2 className="mt-0.5 text-emerald-600" size={18} />
                ) : intervention.type === "MISSING_STEP" ? (
                  <CircleDashed className="mt-0.5 text-amber-600" size={18} />
                ) : (
                  <TriangleAlert className="mt-0.5 text-slate-600" size={18} />
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">
                    {intervention.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {intervention.description}
                  </p>
                  {intervention.ctaHref ? (
                    <Link
                      href={intervention.ctaHref}
                      className="mt-3 inline-flex text-sm font-semibold text-slate-900 underline-offset-4 hover:underline"
                    >
                      {intervention.ctaLabel || "Open"}
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default GoalSuccessTrackerCard;
