"use client";

import { motion } from "framer-motion";
import type { DashboardPayload } from "./types";
import { useAnimatedCounter } from "./hooks";
import { formatIndian } from "./utils";

interface Props {
  data: DashboardPayload;
  visibleFollowUps: number;
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[28px] p-6"
            style={{ background: "white", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}
          >
            <div className="shimmer mb-4 h-10 w-10 rounded-2xl" />
            <div className="shimmer mb-3 h-3 w-28 rounded-full" />
            <div className="shimmer mb-2 h-8 w-36 rounded-full" />
            <div className="shimmer h-3 w-24 rounded-full" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div
          className="xl:col-span-2 rounded-[28px] p-6"
          style={{ background: "white", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}
        >
          <div className="shimmer h-[320px] rounded-[22px]" />
        </div>
        <div
          className="rounded-[28px] p-6"
          style={{ background: "white", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}
        >
          <div className="shimmer h-[320px] rounded-[22px]" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardOverview({ data, visibleFollowUps }: Props) {
  const animatedOutstanding = useAnimatedCounter(data.totalOutstanding);
  const animatedCollected = useAnimatedCounter(data.collectedThisMonth);
  const animatedCustomers = useAnimatedCounter(data.activeCustomers);
  const animatedRate = useAnimatedCounter(data.collectionRate);

  const kpis = [
    {
      label: "Total Outstanding",
      display: `₹${formatIndian(animatedOutstanding)}`,
      icon: "₹",
      color: "var(--coral)",
      lightColor: "var(--coral-light)",
      subtitle: "Pending collections",
      trend: "-2.3% vs last month",
      trendUp: false,
    },
    {
      label: "Collected This Month",
      display: `₹${formatIndian(animatedCollected)}`,
      icon: "✓",
      color: "var(--sage)",
      lightColor: "var(--sage-light)",
      subtitle: "Revenue received",
      trend: "+12.5% vs last month",
      trendUp: true,
    },
    {
      label: "Active Customers",
      display: animatedCustomers.toString(),
      icon: "◎",
      color: "var(--teal)",
      lightColor: "var(--teal-light)",
      subtitle: "With pending balance",
      trend: "Same as last month",
      trendUp: null,
    },
    {
      label: "Collection Rate",
      display: `${animatedRate}%`,
      icon: "%",
      color: "var(--amber)",
      lightColor: "var(--amber-light)",
      subtitle: "Invoices paid on time",
      trend: "+5% improvement",
      trendUp: true,
    },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scaleX: 0.9 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-8 overflow-hidden rounded-2xl py-3"
        style={{
          background: "linear-gradient(135deg, var(--teal-light), #E8F8F7)",
          border: "1px solid rgba(10,143,132,0.15)",
        }}
      >
        <div className="flex whitespace-nowrap animate-ticker">
          {[1, 2].map((copy) => (
            <div key={copy} className="flex items-center gap-8 px-8 text-sm font-medium" style={{ color: "var(--teal)" }}>
              <span>Outstanding: ₹{formatIndian(data.totalOutstanding)}</span>
              <span>•</span>
              <span>{visibleFollowUps} need action today</span>
              <span>•</span>
              <span>Collected: ₹{formatIndian(data.collectedThisMonth)}</span>
              <span>•</span>
              <span>Collection Rate: {data.collectionRate}%</span>
              <span>•</span>
              <span>{data.activeCustomers} active customers</span>
              <span>•</span>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, index) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.08, type: "spring", stiffness: 100 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="relative overflow-hidden rounded-[28px] p-6"
            style={{
              background: "white",
              boxShadow: "var(--shadow-md)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-[28px]" style={{ background: kpi.color }} />
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl text-lg" style={{ background: kpi.lightColor }}>
              {kpi.icon}
            </div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-3)" }}>
              {kpi.label}
            </div>
            <div className="mb-1 text-3xl font-bold animate-slide-up" style={{ color: kpi.color }}>
              {kpi.display}
            </div>
            <div className="mb-3 text-xs" style={{ color: "var(--text-4)" }}>
              {kpi.subtitle}
            </div>
            <div
              className="flex items-center gap-1 text-xs font-medium"
              style={{
                color:
                  kpi.trendUp === true ? "var(--sage)" : kpi.trendUp === false ? "var(--coral)" : "var(--text-3)",
              }}
            >
              {kpi.trendUp === true ? "↑" : kpi.trendUp === false ? "↓" : "→"} {kpi.trend}
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
}
