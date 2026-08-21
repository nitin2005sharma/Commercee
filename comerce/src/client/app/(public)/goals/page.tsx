"use client";

import MainLayout from "@/app/components/templates/MainLayout";
import { useGetGoalsQuery } from "@/app/store/apis/GoalApi";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const GoalsPage = () => {
  const { data, isLoading } = useGetGoalsQuery(undefined);
  const goals = data?.goals || [];

  return (
    <MainLayout>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-[2rem] bg-[linear-gradient(135deg,#1f2937,#0f172a)] p-8 text-white">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-300">
            Shopping Plans
          </p>
          <h1 className="mt-3 text-4xl font-semibold">
            Start with a plan.
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-200 sm:text-base">
            Choose what you are shopping for, set a budget, and review a starter
            bundle before you add anything to cart.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/bundles"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              Build your own bundle
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Custom bundle flow
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">
              Need your own mix instead?
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Start from your shopping list, not a pre-made plan. Add the
              exact items you need, set quantity and budget, then let the app
              turn that into an editable bundle.
            </p>
            <Link
              href="/bundles"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-slate-900"
            >
              Open custom bundle builder
              <ArrowRight size={16} />
            </Link>
          </div>
          {isLoading
            ? [...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="rounded-3xl border border-slate-200 bg-white p-6"
                >
                  <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
                  <div className="mt-4 h-4 w-full animate-pulse rounded bg-slate-100" />
                  <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                </div>
              ))
            : goals.map((goal) => (
                <div
                  key={goal.slug}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Suggested budget ${goal.suggestedBudget}
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-slate-900">
                    {goal.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {goal.description}
                  </p>
                  <p className="mt-4 text-sm font-medium text-slate-700">
                    {goal.audience}
                  </p>

                  <div className="mt-6 space-y-2 text-sm text-slate-600">
                    {goal.steps.map((step) => (
                      <div
                        key={step.key}
                        className="rounded-2xl bg-slate-50 px-3 py-2"
                      >
                        {step.label}
                      </div>
                    ))}
                  </div>

                  <Link
                    href={`/goals/${goal.slug}`}
                    className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-slate-900"
                  >
                    Build this setup
                    <ArrowRight size={16} />
                  </Link>
                </div>
              ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default GoalsPage;
