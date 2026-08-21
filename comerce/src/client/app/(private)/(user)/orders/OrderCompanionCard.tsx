"use client";

import useToast from "@/app/hooks/ui/useToast";
import {
  useCreateOrderReminderMutation,
  useGetOrderCompanionQuery,
} from "@/app/store/apis/OrderApi";
import {
  Bell,
  ClipboardList,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import Link from "next/link";

const OrderCompanionCard = ({ order }: { order: any }) => {
  const { showToast } = useToast();
  const { data, isLoading } = useGetOrderCompanionQuery(order.id);
  const [createReminder, { isLoading: isSavingReminder }] =
    useCreateOrderReminderMutation();
  const companion = data?.companion || order?.companion;

  if (isLoading && !companion) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-sm text-slate-500">Loading companion...</div>
      </div>
    );
  }

  if (!companion) {
    return null;
  }

  const handleCreateReminder = async () => {
    try {
      const reminderDate = new Date();
      reminderDate.setDate(
        reminderDate.getDate() + (companion.reorder?.suggestedDays || 30)
      );

      await createReminder({
        orderId: order.id,
        remindAt: reminderDate.toISOString(),
        note: companion.reorder?.recommendation,
      }).unwrap();

      showToast("Reorder reminder saved", "success");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save reminder";
      showToast(message, "error");
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-slate-400">
        After Your Order
      </div>
      <h2 className="mt-3 text-2xl font-semibold text-slate-900">
        {companion.headline}
      </h2>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <ClipboardList size={16} />
            Suggested tasks
          </div>
          <div className="mt-3 space-y-3 text-sm text-slate-600">
            {(companion.tasks || []).map((task: any) => (
              <div key={task.id || `${task.kind}-${task.title}`}>
                <p className="font-medium text-slate-900">{task.title}</p>
                <p className="mt-1 leading-6">{task.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Wrench size={16} />
            Care guides
          </div>
          <div className="mt-3 space-y-3 text-sm text-slate-600">
            {(companion.careGuides || []).map((guide: any) => (
              <div key={guide.id || `${guide.productName}-${guide.title}`}>
                <p className="font-medium text-slate-900">
                  {guide.productName}
                </p>
                <p className="mt-1 leading-6">{guide.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <ShieldCheck size={16} />
          Warranty and coverage
        </div>
        <div className="mt-3 space-y-3 text-sm text-slate-600">
          {(companion.warranties || []).map((warranty: any) => (
            <div key={warranty.id || warranty.title}>
              <p className="font-medium text-slate-900">
                {warranty.productName || "Order item"}
              </p>
              <p className="mt-1">{warranty.description}</p>
              {warranty.claimSteps?.length ? (
                <div className="mt-2 space-y-1">
                  {warranty.claimSteps.map((step: string) => (
                    <p key={step}>{step}</p>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
          <Bell size={16} />
          Reorder and support
        </div>
        <p className="mt-2 text-sm leading-6 text-emerald-900">
          {companion.reorder?.recommendation}
        </p>
        <p className="mt-2 text-sm leading-6 text-emerald-900">
          {companion.support?.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={handleCreateReminder}
            disabled={isSavingReminder}
            className="rounded-xl bg-emerald-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-400"
          >
            {isSavingReminder ? "Saving..." : "Remind me later"}
          </button>
          <Link
            href={`/support?orderId=${order.id}`}
            className="rounded-xl border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-900 transition hover:bg-white"
          >
            Report an issue
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderCompanionCard;
