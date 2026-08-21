"use client";

import dynamic from "next/dynamic";
import StatsCard from "@/app/components/organisms/StatsCard";
import Dropdown from "@/app/components/molecules/Dropdown";
import {
  DollarSign,
  Layers3,
  PackageCheck,
  ShieldCheck,
  Target,
  Users,
  Workflow,
} from "lucide-react";
import { motion } from "framer-motion";
import { Controller, useForm } from "react-hook-form";
import React from "react";
import useFormatPrice from "@/app/hooks/ui/useFormatPrice";
import { useQuery } from "@apollo/client";
import { GET_ANALYTICS_OVERVIEW } from "@/app/gql/Dashboard";
import CustomLoader from "@/app/components/feedback/CustomLoader";
import { withAuth } from "@/app/components/HOC/WithAuth";

const AreaChart = dynamic(
  () => import("@/app/components/charts/AreaChartComponent"),
  { ssr: false }
);
const BarChart = dynamic(
  () => import("@/app/components/charts/BarChartComponent"),
  { ssr: false }
);

interface FormData {
  timePeriod: string;
}

const Dashboard = () => {
  const { control, watch } = useForm<FormData>({
    defaultValues: {
      timePeriod: "allTime",
    },
  });
  const formatPrice = useFormatPrice();

  const timePeriodOptions = [
    { label: "Last 7 Days", value: "last7days" },
    { label: "Last Month", value: "lastMonth" },
    { label: "Last Year", value: "lastYear" },
    { label: "All Time", value: "allTime" },
  ];

  const { timePeriod } = watch();
  const queryParams = {
    timePeriod: timePeriod || "allTime",
  };

  const { data, loading, error } = useQuery(GET_ANALYTICS_OVERVIEW, {
    variables: { params: queryParams },
  });

  const goalAnalytics = data?.goalCommerceAnalytics;
  const topGoals = [...(goalAnalytics?.goals || [])]
    .sort((a, b) => {
      if (b.orderAttachCount !== a.orderAttachCount) {
        return b.orderAttachCount - a.orderAttachCount;
      }

      return b.successRate - a.successRate;
    })
    .slice(0, 5);
  const weakestSteps = goalAnalytics?.weakestSteps || [];
  const salesByProduct = {
    categories: data?.productPerformance?.map((p) => p.name) || [],
    data: data?.productPerformance?.map((p) => p.revenue) || [],
  };

  if (loading) {
    return <CustomLoader />;
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Error loading dashboard data
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen space-y-6 p-4 sm:p-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7c6f64]">
            Store Dashboard
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">
            Track plans, carts, orders, and revenue in one place
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            See how shoppers use saved plans, bundles, shared carts, and checkout
            without digging through separate reports.
          </p>
        </div>
        <div className="w-full sm:max-w-[220px]">
          <Controller
            name="timePeriod"
            control={control}
            render={({ field }) => (
              <Dropdown
                onChange={field.onChange}
                options={timePeriodOptions}
                value={field.value}
                label="Time Period"
                className="w-full"
              />
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Goal Attach Rate"
          value={`${goalAnalytics?.goalAttachRate || 0}%`}
          percentage={goalAnalytics?.goalAttachRate || 0}
          caption="carts with a saved goal"
          icon={<Target className="h-5 w-5" />}
        />
        <StatsCard
          title="Bundle To Cart"
          value={`${goalAnalytics?.bundleToCartRate || 0}%`}
          percentage={goalAnalytics?.bundleToCartRate || 0}
          caption="bundles that became carts"
          icon={<Layers3 className="h-5 w-5" />}
        />
        <StatsCard
          title="Shared Carts Ready"
          value={`${goalAnalytics?.readySharedCarts || 0}/${goalAnalytics?.totalSharedCarts || 0}`}
          percentage={goalAnalytics?.assignmentCoverageRate || 0}
          caption="assignment coverage"
          icon={<Users className="h-5 w-5" />}
        />
        <StatsCard
          title="Average Success"
          value={`${goalAnalytics?.avgSuccessRate || 0}%`}
          percentage={goalAnalytics?.avgSuccessRate || 0}
          caption="average plan rating"
          icon={<ShieldCheck className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total Bundles"
          value={goalAnalytics?.totalBundles || 0}
          percentage={goalAnalytics?.bundleToCartRate || 0}
          caption="saved planning drafts"
          icon={<Layers3 className="h-5 w-5" />}
        />
        <StatsCard
          title="Goal To Order"
          value={`${goalAnalytics?.goalOrderConversionRate || 0}%`}
          percentage={goalAnalytics?.avgGoalToOrderConversionRate || 0}
          caption="goal carts to orders"
          icon={<PackageCheck className="h-5 w-5" />}
        />
        <StatsCard
          title="Avg Collaborators"
          value={goalAnalytics?.avgCollaborators || 0}
          percentage={goalAnalytics?.avgCollaborators || 0}
          caption="members per shared cart"
          icon={<Users className="h-5 w-5" />}
        />
        <StatsCard
          title="Revenue"
          value={formatPrice(data?.revenueAnalytics?.totalRevenue || 0)}
          percentage={data?.revenueAnalytics?.changes?.revenue || 0}
          caption="store revenue"
          icon={<DollarSign className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Workflow size={16} />
            Best-performing plans
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            These plans are most often saved, shared, and turned into completed
            orders.
          </p>

          <div className="mt-5 space-y-3">
            {topGoals.map((goal) => (
              <div
                key={goal.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-xl">
                    <p className="text-lg font-semibold text-slate-900">
                      {goal.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {goal.audience}
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white px-3 py-2 text-sm text-slate-700">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Bundles
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {goal.bundleCount}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white px-3 py-2 text-sm text-slate-700">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Success
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {goal.successRate}%
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white px-3 py-2 text-sm text-slate-700">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Goal to order
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {goal.goalToOrderConversionRate}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {!topGoals.length ? (
              <p className="text-sm text-slate-500">
                Plan analytics will appear once shoppers start saving bundles and
                checking out.
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Target size={16} />
              Steps that need attention
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              These steps are most often marked partial or missed after checkout.
            </p>
            <div className="mt-5 space-y-3">
              {weakestSteps.map((step) => (
                <div key={step.stepKey} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {step.stepLabel}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Seen across {step.goals.join(", ") || "goal flows"}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold text-rose-700">
                        {step.missCount} missed
                      </p>
                      <p className="mt-1 font-medium text-amber-700">
                        {step.partialCount} partial
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {!weakestSteps.length ? (
                <p className="text-sm text-slate-500">
                  Step-level data will show up after more order check-ins are
                  submitted.
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Users size={16} />
              Collaboration health
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Shared carts
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {goalAnalytics?.totalSharedCarts || 0}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Assignment coverage
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {goalAnalytics?.assignmentCoverageRate || 0}%
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Shared carts show how often people divide up items before checkout.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7c6f64]">
          Sales Overview
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-900">
          Standard store performance
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Revenue, sales, and product performance remain easy to review alongside
          the newer planning tools.
        </p>

        <div className="mt-6 space-y-6">
          <AreaChart
            title="Revenue Trends"
            data={data?.revenueAnalytics?.monthlyTrends?.revenue || []}
            categories={data?.revenueAnalytics?.monthlyTrends?.labels || []}
            color="#22c55e"
            percentageChange={data?.revenueAnalytics?.changes?.revenue || 0}
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 p-5">
              <h3 className="text-lg font-semibold text-slate-900">
                Top products by revenue
              </h3>
              <div className="mt-4 space-y-3">
                {(data?.productPerformance || []).slice(0, 8).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-2xl bg-white px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{product.name}</p>
                      <p className="text-sm text-slate-500">
                        {product.quantity} units sold
                      </p>
                    </div>
                    <p className="font-semibold text-slate-900">
                      {formatPrice(product.revenue)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <BarChart
              title="Sales by Product"
              data={salesByProduct.data}
              categories={salesByProduct.categories}
              color="#4CAF50"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default withAuth(Dashboard);
