"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Target, Users } from "lucide-react";

type HeroGoal = {
  id: string;
  slug: string;
  title: string;
  suggestedBudget: number;
  steps: Array<{ key: string; label: string }>;
};

interface HeroSectionProps {
  isPreview?: boolean;
  featuredGoals?: HeroGoal[];
  totalGoals?: number;
  totalProducts?: number;
}

const fallbackGoals: HeroGoal[] = [
  {
    id: "travel-outfit",
    slug: "travel-outfit",
    title: "Travel Outfit",
    suggestedBudget: 350,
    steps: [
      { key: "base", label: "Base outfit" },
      { key: "layer", label: "Travel layer" },
      { key: "carry", label: "Carry companion" },
    ],
  },
  {
    id: "wfh-desk",
    slug: "wfh-desk",
    title: "WFH Desk Reset",
    suggestedBudget: 900,
    steps: [
      { key: "desk-anchor", label: "Desk anchor" },
      { key: "comfort", label: "Comfort layer" },
      { key: "productivity", label: "Productivity boost" },
    ],
  },
];

const formatCurrency = (value?: number) =>
  typeof value === "number" ? `$${value.toFixed(0)}` : "$0";

const HeroSection = ({
  isPreview = false,
  featuredGoals = fallbackGoals,
  totalGoals = fallbackGoals.length,
  totalProducts = 0,
}: HeroSectionProps) => {
  const goals = featuredGoals.length ? featuredGoals.slice(0, 2) : fallbackGoals;

  return (
    <section
      className={`relative w-full ${
        isPreview ? "scale-90 py-3" : "py-6 sm:py-8 lg:py-10"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4">
        <div className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.22),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.18),_transparent_28%),linear-gradient(140deg,#1f2937,_#111827_45%,#334155)] p-6 text-white shadow-[0_35px_80px_rgba(15,23,42,0.28)] sm:p-8 lg:p-10">
          <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="relative">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-100"
              >
                Curated shopping
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="mt-5 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl"
              >
                Find the right products faster.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mt-5 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg"
              >
                Start with a ready-made plan, adjust the items, or browse the
                catalog the usual way. Keep what works and change what does not.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mt-7 flex flex-wrap gap-3"
              >
                <Link
                  href="/goals"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                >
                  Start with a plan
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/bundles"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Build your own bundle
                </Link>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Browse the catalog
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="mt-8 grid gap-4 sm:grid-cols-3"
              >
                <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                    <Target size={14} />
                    Shopping plans
                  </div>
                  <p className="mt-3 text-3xl font-semibold text-white">
                    {totalGoals}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">
                    Ready-made lists for common shopping needs.
                  </p>
                </div>
                <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                    <Users size={14} />
                    Shared carts
                  </div>
                  <p className="mt-3 text-3xl font-semibold text-white">
                    Live
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">
                    Invite others when a purchase needs more than one opinion.
                  </p>
                </div>
                <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                    <ShieldCheck size={14} />
                    Product catalog
                  </div>
                  <p className="mt-3 text-3xl font-semibold text-white">
                    {totalProducts || "Catalog"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">
                    Browse directly whenever you already know what you need.
                  </p>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.55 }}
              className="grid gap-4"
            >
              {goals.map((goal, index) => (
                <div
                  key={goal.id}
                  className={`rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur ${
                    index === 1 ? "xl:ml-8" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                        Plan preview
                      </p>
                      <h2 className="mt-3 text-2xl font-semibold text-white">
                        {goal.title}
                      </h2>
                    </div>
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-slate-100">
                      {formatCurrency(goal.suggestedBudget)}
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {goal.steps.map((step) => (
                      <span
                        key={step.key}
                        className="rounded-full border border-white/10 bg-black/10 px-3 py-1 text-xs font-medium text-slate-100"
                      >
                        {step.label}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 text-sm leading-7 text-slate-200">
                    Review the suggested items, change anything that does not fit,
                    and save the plan when it looks right.
                  </div>

                  <Link
                    href={`/goals/${goal.slug}`}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white"
                  >
                    Open this goal
                    <ArrowRight size={16} />
                  </Link>
                </div>
              ))}

              <div className="rounded-[2rem] border border-dashed border-white/20 bg-black/10 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                  Built for real shopping
                </p>
                <p className="mt-3 text-lg font-semibold text-white">
                  Fewer tabs open. Clearer choices. Easier checkout.
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-200">
                  Use plans when you want help, or jump straight into the catalog.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
