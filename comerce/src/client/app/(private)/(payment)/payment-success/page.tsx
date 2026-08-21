"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock3,
  PackageCheck,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useGetOrderGoalSuccessQuery,
  useGetOrderQuery,
} from "@/app/store/apis/OrderApi";

const formatCurrency = (value?: number) =>
  typeof value === "number" ? `$${value.toFixed(2)}` : "$0.00";

const fallbackStages = [
  {
    label: "After delivery",
    description: "Confirm everything arrived complete and intact.",
  },
  {
    label: "After setup",
    description: "Check whether the order really solved the job you bought it for.",
  },
  {
    label: "2-4 weeks later",
    description: "Reflect on whether this still feels like the right plan.",
  },
];

const PaymentSucceeded = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [secondsLeft, setSecondsLeft] = useState(8);
  const orderId = searchParams.get("orderId") || "";
  const { data, isFetching } = useGetOrderQuery(orderId, {
    skip: !orderId,
    pollingInterval: orderId ? 2500 : 0,
    refetchOnMountOrArgChange: true,
  });
  const { data: goalSuccessData } = useGetOrderGoalSuccessQuery(orderId, {
    skip: !orderId || !data?.order,
  });

  const order = data?.order;
  const goalSuccess = goalSuccessData?.goalSuccess;
  const nextStages = useMemo(() => {
    if (goalSuccess?.stages?.length) {
      return goalSuccess.stages.slice(0, 3);
    }

    return fallbackStages;
  }, [goalSuccess?.stages]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(intervalId);
          router.push(orderId ? `/orders/${orderId}` : "/orders?from=checkout");
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [orderId, router]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_28%),linear-gradient(180deg,#ecfdf5,_#ffffff_48%,#f8fafc)] px-4 py-10"
    >
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[2.5rem] border border-emerald-100 bg-white p-6 shadow-[0_30px_70px_rgba(16,185,129,0.12)] sm:p-8">
          <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-emerald-100 text-emerald-700"
              >
                <CheckCircle2 size={46} />
              </motion.div>

              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Payment Confirmed
              </p>
              <h1 className="mt-3 text-4xl font-semibold text-slate-900">
                Your checkout is complete.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
                Your order is in. You can review the items, check delivery
                updates, and contact support from the order page.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={orderId ? `/orders/${orderId}` : "/orders?from=checkout"}
                  className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  View order
                </Link>
                <Link
                  href="/support"
                  className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Contact support
                </Link>
              </div>

              <p className="mt-6 text-sm font-medium text-emerald-700">
                Redirecting automatically in {secondsLeft}s...
              </p>

              {orderId && !order ? (
                <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  {isFetching
                    ? "We are still syncing your order details from checkout. This usually resolves in a few seconds."
                    : "Order details are still catching up. You can still open your orders page normally."}
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Target size={16} />
                  Saved plan
                </div>
                {order?.goalTemplate ? (
                  <div className="mt-4">
                    <p className="text-2xl font-semibold text-slate-900">
                      {order.goalTemplate.title}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      {order.goalTemplate.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(order.goalTemplate.steps || []).map((step: any) => (
                        <span
                          key={step.id || step.key || step.stepKey}
                          className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700"
                        >
                          {step.label}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    This order is ready to review even if it did not start from a
                    saved plan.
                  </p>
                )}
              </div>

              {order?.goalBundle ? (
                <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    Bundle
                  </div>
                  <p className="mt-4 text-lg font-semibold text-slate-900">
                    {order.goalBundle.name || "Saved bundle"}
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Planned budget
                      </p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">
                        {formatCurrency(order.goalBundle.budget)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Planned total
                      </p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">
                        {formatCurrency(order.goalBundle.total)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <PackageCheck size={16} />
                  What to check next
                </div>
                <div className="mt-4 space-y-3">
                  {nextStages.map((stage: any) => (
                    <div
                      key={stage.stage || stage.label}
                      className="rounded-2xl bg-white p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900 text-white">
                          <Clock3 size={16} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {stage.label}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            {stage.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PaymentSucceeded;
