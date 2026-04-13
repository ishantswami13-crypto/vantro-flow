"use client";

import Link from "next/link";
import type { Dispatch, SetStateAction } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import InvoiceActions from "@/components/InvoiceActions";
import type { DashboardPayload } from "./types";
import { formatIndian, initials, shortDateLabel, weekdayLabel } from "./utils";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface Props {
  data: DashboardPayload;
  resolvedInvoiceIds: Set<number>;
  setResolvedInvoiceIds: Dispatch<SetStateAction<Set<number>>>;
}

export default function DashboardCollectionsBoard({
  data,
  resolvedInvoiceIds,
  setResolvedInvoiceIds,
}: Props) {
  const visibleFollowUps = data.followUpList.filter((item) => !resolvedInvoiceIds.has(item.id));
  const agingBuckets = [
    {
      label: "Current",
      amount: data.agingBuckets.current.amount,
      count: data.agingBuckets.current.count,
      color: "var(--teal)",
      critical: false,
    },
    {
      label: "1-30 Days",
      amount: data.agingBuckets.aging1to30.amount,
      count: data.agingBuckets.aging1to30.count,
      color: "var(--amber)",
      critical: false,
    },
    {
      label: "31-60 Days",
      amount: data.agingBuckets.aging31to60.amount,
      count: data.agingBuckets.aging31to60.count,
      color: "#F97316",
      critical: false,
    },
    {
      label: "60+ Days",
      amount: data.agingBuckets.aging60plus.amount,
      count: data.agingBuckets.aging60plus.count,
      color: "var(--coral)",
      critical: true,
    },
  ];

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mb-8"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold" style={{ color: "var(--text-1)" }}>
              Receivables Aging
            </h2>
            <p className="mt-0.5 text-xs" style={{ color: "var(--text-3)" }}>
              Track where your money is by age
            </p>
          </div>
          <Link href="/analytics" className="text-xs font-medium hover:underline" style={{ color: "var(--teal)" }}>
            View full report →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {agingBuckets.map((bucket, index) => (
            <motion.div
              key={bucket.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 + index * 0.05 }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="relative overflow-hidden rounded-[28px] p-5"
              style={{
                background: "white",
                boxShadow: bucket.critical ? "0 8px 32px rgba(229,53,74,0.12)" : "var(--shadow-sm)",
                border: bucket.critical ? "1px solid rgba(229,53,74,0.2)" : "1px solid var(--border)",
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: bucket.color }} />
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: bucket.color }}>
                  {bucket.label}
                </span>
                {bucket.critical ? (
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{ background: "var(--coral-light)", color: "var(--coral)" }}
                  >
                    Urgent
                  </span>
                ) : null}
              </div>
              <div className="mb-0.5 text-2xl font-bold" style={{ color: bucket.critical ? "var(--coral)" : "var(--text-1)" }}>
                ₹{formatIndian(bucket.amount)}
              </div>
              <div className="mb-3 text-xs" style={{ color: "var(--text-4)" }}>
                {bucket.count} invoice{bucket.count !== 1 ? "s" : ""}
              </div>
              <div className="h-1.5 rounded-full" style={{ background: "var(--bg-surface-3)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((bucket.amount / (data.totalOutstanding || 1)) * 100, 100)}%` }}
                  transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
                  className="h-1.5 rounded-full"
                  style={{ background: bucket.color }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="rounded-[28px] p-6"
          style={{ background: "white", boxShadow: "var(--shadow-md)", border: "1px solid var(--border)" }}
        >
          <h2 className="mb-4 text-lg font-bold" style={{ color: "var(--text-1)" }}>
            This Week
          </h2>

          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {[
              {
                label: "Expected Inflow",
                amount: data.weekForecast.expectedThisWeek,
                color: "var(--sage)",
                icon: "↓",
              },
              {
                label: "Promises Due",
                amount: data.weekForecast.promisesDue,
                color: "var(--amber)",
                icon: "↺",
              },
              {
                label: "Overdue Risk",
                amount: data.weekForecast.overdueRisk,
                color: "var(--coral)",
                icon: "!",
              },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-4">
                <div className="text-xs font-medium" style={{ color: "var(--text-3)" }}>
                  {row.icon} {row.label}
                </div>
                <div className="text-base font-bold" style={{ color: row.color }}>
                  ₹{formatIndian(row.amount)}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="mb-3 text-xs font-medium" style={{ color: "var(--text-3)" }}>
              Weekly breakdown
            </div>
            <div className="h-[110px]">
              <Bar
                data={{
                  labels: data.last7Days.map((item) => weekdayLabel(item.date)),
                  datasets: [
                    {
                      data: data.last7Days.map((item) => item.amount),
                      backgroundColor: "rgba(10,143,132,0.15)",
                      hoverBackgroundColor: "rgba(10,143,132,0.4)",
                      borderRadius: 6,
                      borderSkipped: false,
                    },
                  ],
                }}
                options={{
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: { legend: { display: false }, tooltip: { enabled: false } },
                  scales: {
                    x: {
                      grid: { display: false },
                      ticks: { color: "#ADADB0", font: { size: 9 } },
                    },
                    y: { display: false },
                  },
                  animation: { duration: 1000 },
                }}
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="xl:col-span-2 rounded-[28px] p-6"
          style={{ background: "white", boxShadow: "var(--shadow-md)", border: "1px solid var(--border)" }}
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold" style={{ color: "var(--text-1)" }}>
                Follow Up Today
              </h2>
              <p className="text-xs" style={{ color: "var(--text-3)" }}>
                Sorted by urgency
              </p>
            </div>
            <div className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: "var(--coral-light)", color: "var(--coral)" }}>
              {visibleFollowUps.length} pending
            </div>
          </div>

          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            <AnimatePresence>
              {visibleFollowUps.map((item, index) => {
                const daysOverdue = item.daysOverdue ?? 0;
                const severity = daysOverdue > 60 ? "high" : daysOverdue > 30 ? "medium" : "low";
                const color =
                  severity === "high" ? "var(--coral)" : severity === "medium" ? "var(--amber)" : "var(--teal)";
                const lightColor =
                  severity === "high"
                    ? "var(--coral-light)"
                    : severity === "medium"
                      ? "var(--amber-light)"
                      : "var(--teal-light)";
                const outstanding = Math.max(Number(item.amount) - Number(item.amountPaid ?? 0), 0);

                return (
                  <motion.div
                    layout
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12, scale: 0.98 }}
                    transition={{ delay: 1.05 + index * 0.04 }}
                    whileHover={{ x: 3, backgroundColor: "#FAFAFA", transition: { duration: 0.15 } }}
                    className="flex flex-col gap-3 rounded-2xl p-4 lg:flex-row lg:items-center"
                    style={{ border: "1px solid var(--border)" }}
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                      style={{ background: lightColor, color, fontFamily: "var(--font-syne, 'Bricolage Grotesque')" }}
                    >
                      {initials(item.customerName)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/customers/${item.customerId}`}
                        className="block truncate text-sm font-semibold"
                        style={{ fontFamily: "var(--font-syne, 'Bricolage Grotesque')", color: "var(--text-1)" }}
                      >
                        {item.customerName}
                      </Link>
                      <div className="truncate text-xs" style={{ color: "var(--text-4)" }}>
                        {item.invoiceNumber}
                        {item.dueDate ? ` · Due ${shortDateLabel(item.dueDate)}` : ""}
                      </div>
                    </div>

                    <div className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: lightColor, color }}>
                      {daysOverdue}d
                    </div>

                    <div className="w-full text-left text-sm font-bold lg:w-24 lg:text-right" style={{ color }}>
                      ₹{formatIndian(outstanding)}
                    </div>

                    <div className="flex shrink-0">
                      <InvoiceActions
                        customerId={item.customerId}
                        invoiceId={item.id}
                        amount={outstanding}
                        onPaid={() =>
                          setResolvedInvoiceIds((current) => {
                            const next = new Set(current);
                            next.add(item.id);
                            return next;
                          })
                        }
                      />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </>
  );
}
