"use client";

import Link from "next/link";
import { ArrowRight, Coins, Layers3, Users } from "lucide-react";

type GoalCard = {
  id: string;
  slug: string;
  title: string;
  description: string;
  audience: string;
  suggestedBudget: number;
  steps: Array<{ key: string; label: string }>;
};

const formatCurrency = (value?: number) =>
  typeof value === "number" ? `$${value.toFixed(0)}` : "$0";

const GoalLaunchpad = ({ goals }: { goals: GoalCard[] }) => {
  if (!goals.length) {
    return null;
  }

  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7c6f64]">
              Shopping Plans
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-[#1f2937]">
              Ready-made plans for common needs
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Pick a plan, review the suggested products, and adjust the bundle
              before adding anything to your cart.
            </p>
          </div>
          <Link
            href="/goals"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
          >
            Explore all goals
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {goals.map((goal) => (
            <Link
              key={goal.id}
              href={`/goals/${goal.slug}`}
              className="group rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-[#f5efe8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#8b5e34]">
                  Plan
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {goal.steps.length} steps
                </span>
              </div>

              <h3 className="mt-5 text-2xl font-semibold text-slate-900 transition group-hover:text-[#8b5e34]">
                {goal.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {goal.description}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <Coins size={14} />
                    Budget
                  </div>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {formatCurrency(goal.suggestedBudget)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <Users size={14} />
                    Best for
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-medium text-slate-900">
                    {goal.audience}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-[#f8fafc] p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <Layers3 size={14} />
                  Included items
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {goal.steps.map((step) => (
                    <span
                      key={step.key}
                      className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700"
                    >
                      {step.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                Start this plan
                <ArrowRight
                  size={16}
                  className="transition group-hover:translate-x-1"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GoalLaunchpad;
