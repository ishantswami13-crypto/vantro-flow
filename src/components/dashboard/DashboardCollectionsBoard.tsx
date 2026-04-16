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
      color: "var(--accent)",
      critical: false,
    },
    {
      label: "1-30 Days",
      amount: data.agingBuckets.aging1to30.amount,
      count: data.agingBuckets.aging1to30.count,
      color: "var(--warning)",
      critical: false,
    },
    {
      label: "31-60 Days",
      amount: data.agingBuckets.aging31to60.amount,
      count: data.agingBuckets.aging31to60.count,
      color: "#B86D28",
      critical: false,
    },
    {
      label: "60+ Days",
      amount: data.agingBuckets.aging60plus.amount,
      count: data.agingBuckets.aging60plus.count,
      color: "var(--danger)",
      critical: true,
    },
  ];

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.34, duration: 0.26 }}
        className="mb-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.03em]" style={{ color: "var(--text-1)" }}>
              Receivables aging
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
              Exposure grouped by collection age.
            </p>
          </div>
          <Link href="/analytics" className="text-sm font-medium" style={{ color: "var(--accent)" }}>
            View analytics
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {agingBuckets.map((bucket, index) => (
            <motion.div
              key={bucket.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38 + index * 0.04, duration: 0.24 }}
              className="rounded-[20px] p-5"
              style={{
                background: "var(--bg-surface)",
                boxShadow: "var(--shadow-sm)",
                border: bucket.critical ? "1px solid rgba(194,75,96,0.18)" : "1px solid var(--border)",
              }}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: bucket.color }}>
                  {bucket.label}
                </span>
                {bucket.critical ? (
                  <span className="linear-tag" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
                    Urgent
                  </span>
                ) : null}
              </div>
              <div className="text-2xl font-semibold tracking-[-0.05em]" style={{ color: "var(--text-1)" }}>
                INR {formatIndian(bucket.amount)}
              </div>
              <div className="mt-1 text-xs" style={{ color: "var(--text-4)" }}>
                {bucket.count} invoice{bucket.count !== 1 ? "s" : ""}
              </div>
              <div className="mt-4 h-1.5 rounded-full" style={{ background: "var(--bg-surface-3)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((bucket.amount / (data.totalOutstanding || 1)) * 100, 100)}%` }}
                  transition={{ delay: 0.7, duration: 0.55, ease: "easeOut" }}
                  className="h-1.5 rounded-full"
                  style={{ background: bucket.color }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.24 }}
          className="rounded-[20px] p-5"
          style={{ background: "var(--bg-surface)", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-base font-semibold tracking-[-0.03em]" style={{ color: "var(--text-1)" }}>
            This week
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
            Forecasted movement across expected inflow, promises, and overdue risk.
          </p>

          <div className="mt-5 space-y-4">
            {[
              {
                label: "Expected inflow",
                amount: data.weekForecast.expectedThisWeek,
                color: "var(--success)",
              },
              {
                label: "Promises due",
                amount: data.weekForecast.promisesDue,
                color: "var(--warning)",
              },
              {
                label: "Overdue risk",
                amount: data.weekForecast.overdueRisk,
                color: "var(--danger)",
              },
            ].map((row, index) => (
              <div
                key={row.label}
                className={index === 0 ? "" : "border-t pt-4"}
                style={{ borderColor: "var(--border)" }}
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-4)" }}>
                  {row.label}
                </div>
                <div className="mt-2 text-lg font-semibold tracking-[-0.03em]" style={{ color: row.color }}>
                  INR {formatIndian(row.amount)}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t pt-4" style={{ borderColor: "var(--border)" }}>
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-4)" }}>
              Weekly breakdown
            </div>
            <div className="h-[110px]">
              <Bar
                data={{
                  labels: data.last7Days.map((item) => weekdayLabel(item.date)),
                  datasets: [
                    {
                      data: data.last7Days.map((item) => item.amount),
                      backgroundColor: "rgba(94,106,210,0.16)",
                      hoverBackgroundColor: "rgba(94,106,210,0.24)",
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
                      ticks: { color: "#98A2B3", font: { size: 9 } },
                    },
                    y: { display: false },
                  },
                  animation: { duration: 700 },
                }}
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48, duration: 0.24 }}
          id="follow-up-today"
          className="rounded-[20px] p-5"
          style={{ background: "var(--bg-surface)", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }}
        >
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold tracking-[-0.03em]" style={{ color: "var(--text-1)" }}>
                Follow up today
              </h2>
              <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
                Ordered by overdue age and open balance.
              </p>
            </div>
            <div className="linear-tag" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
              {visibleFollowUps.length} pending
            </div>
          </div>

          <div className="max-h-[460px] overflow-y-auto pr-1">
            <AnimatePresence>
              {visibleFollowUps.map((item, index) => {
                const daysOverdue = item.daysOverdue ?? 0;
                const severity = daysOverdue > 60 ? "high" : daysOverdue > 30 ? "medium" : "low";
                const color =
                  severity === "high" ? "var(--danger)" : severity === "medium" ? "var(--warning)" : "var(--accent)";
                const lightColor =
                  severity === "high"
                    ? "var(--danger-soft)"
                    : severity === "medium"
                      ? "var(--warning-soft)"
                      : "var(--accent-soft)";
                const outstanding = Math.max(Number(item.amount) - Number(item.amountPaid ?? 0), 0);

                return (
                  <motion.div
                    layout
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ delay: 0.5 + index * 0.03, duration: 0.2 }}
                    className="apple-table-row grid gap-4 py-4 lg:grid-cols-[minmax(0,1.5fr)_auto_auto_auto]"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-sm font-semibold"
                        style={{ background: lightColor, color }}
                      >
                        {initials(item.customerName)}
                      </div>

                      <div className="min-w-0">
                        <Link
                          href={`/customers/${item.customerId}`}
                          className="block truncate text-sm font-semibold tracking-[-0.02em]"
                          style={{ color: "var(--text-1)" }}
                        >
                          {item.customerName}
                        </Link>
                        <div className="truncate text-xs" style={{ color: "var(--text-4)" }}>
                          {item.invoiceNumber}
                          {item.dueDate ? ` | Due ${shortDateLabel(item.dueDate)}` : ""}
                        </div>
                      </div>
                    </div>

                    <div className="linear-tag" style={{ background: lightColor, color }}>
                      {daysOverdue}d
                    </div>

                    <div className="w-full text-left text-sm font-semibold tracking-[-0.02em] lg:w-32 lg:text-right" style={{ color: "var(--text-1)" }}>
                      INR {formatIndian(outstanding)}
                    </div>

                    <div className="flex shrink-0 justify-start lg:justify-end">
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
