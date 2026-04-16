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
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[20px] p-5"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
          >
            <div className="shimmer mb-3 h-3 w-24 rounded-full" />
            <div className="shimmer mb-2 h-8 w-32 rounded-full" />
            <div className="shimmer h-3 w-24 rounded-full" />
          </div>
        ))}
      </div>
      <div className="rounded-[20px] p-5" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <div className="shimmer h-20 rounded-[16px]" />
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
      label: "Total outstanding",
      display: `INR ${formatIndian(animatedOutstanding)}`,
      accent: "var(--danger)",
      note: "Pending collections",
    },
    {
      label: "Collected this month",
      display: `INR ${formatIndian(animatedCollected)}`,
      accent: "var(--success)",
      note: "Recovered cash",
    },
    {
      label: "Active customers",
      display: animatedCustomers.toString(),
      accent: "var(--text-1)",
      note: "Open accounts",
    },
    {
      label: "Collection rate",
      display: `${animatedRate}%`,
      accent: "var(--accent)",
      note: "Paid on time",
    },
  ];

  return (
    <section className="mb-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, index) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 + index * 0.05, duration: 0.24 }}
            className="rounded-[20px] px-5 py-5"
            style={{
              background: "var(--bg-surface)",
              boxShadow: "var(--shadow-sm)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-4)" }}>
              {kpi.label}
            </div>
            <div className="mt-2 text-[2rem] font-semibold tracking-[-0.05em]" style={{ color: kpi.accent }}>
              {kpi.display}
            </div>
            <div className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
              {kpi.note}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.24 }}
        className="mt-4 rounded-[20px] px-5 py-4"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Open today", value: `${visibleFollowUps} urgent actions` },
            { label: "Promised this week", value: `INR ${formatIndian(data.weekForecast.promisesDue)}` },
            { label: "Overdue risk", value: `INR ${formatIndian(data.weekForecast.overdueRisk)}` },
            { label: "Expected inflow", value: `INR ${formatIndian(data.weekForecast.expectedThisWeek)}` },
          ].map((item, index) => (
            <div
              key={item.label}
              className={index === 0 ? "" : "border-t pt-4 md:border-l md:border-t-0 md:pl-4 md:pt-0"}
              style={{ borderColor: "var(--border)" }}
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-4)" }}>
                {item.label}
              </div>
              <div className="mt-2 text-sm font-semibold tracking-[-0.02em]" style={{ color: "var(--text-1)" }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
