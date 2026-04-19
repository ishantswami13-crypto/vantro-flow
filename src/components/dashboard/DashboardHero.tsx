"use client";

import Link from "next/link";
import type { DashboardPayload } from "./types";
import { formatDashboardDate, formatDashboardTime, formatIndian, getGreeting } from "./utils";
import { FEATURE_MODULES, getScaleLabel } from "@/lib/onboarding-config";

interface Props {
  clock: Date | null;
  data: DashboardPayload | null;
  visibleFollowUps: number;
}

export default function DashboardHero({ clock, data, visibleFollowUps }: Props) {
  const selectedModules = data?.organization.selectedModules ?? [];
  const activeModules = FEATURE_MODULES.filter((module) => selectedModules.includes(module.id)).slice(0, 4);
  const primaryLink = selectedModules.includes("daily_followups")
    ? { href: "#follow-up-today", label: "Review follow-ups" }
    : selectedModules.includes("customer_ledgers")
      ? { href: "/customers", label: "Open customers" }
      : { href: "/upload", label: "Import ledger" };

  return (
    <section className="mb-5 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_360px]">
      <div className="surface-panel rounded-[24px] px-6 py-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="linear-tag">Dashboard</span>
          {data?.organization.companyScale ? (
            <span className="linear-tag">{getScaleLabel(data.organization.companyScale)}</span>
          ) : null}
          {clock ? <span className="linear-tag">{formatDashboardDate(clock)}</span> : null}
        </div>

        <div className="mt-5 max-w-3xl">
          <h1 className="text-[2.2rem] font-semibold leading-[1] tracking-[-0.05em] sm:text-[2.8rem]">
            {clock ? `${getGreeting(clock)}, Ishant.` : "Collections workspace."}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 sm:text-base" style={{ color: "var(--text-3)" }}>
            Review open exposure, clear today&apos;s priorities, and keep promised cash movement visible without digging through ledgers.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={primaryLink.href} className="apple-button apple-button-primary px-4 py-2.5 text-sm font-semibold">
            {primaryLink.label}
          </Link>
          {selectedModules.includes("invoice_imports") ? (
            <Link href="/upload" className="apple-button apple-button-secondary px-4 py-2.5 text-sm font-medium">
              Import invoices
            </Link>
          ) : null}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            {
              label: "Outstanding",
              value: data ? `${formatIndian(data.totalOutstanding)}` : "Loading",
              note: "Open balance",
            },
            {
              label: "Need action",
              value: data ? `${visibleFollowUps} invoices` : "Loading",
              note: "Queue for today",
            },
            {
              label: "Expected this week",
              value: data ? `${formatIndian(data.weekForecast.expectedThisWeek)}` : "Loading",
              note: "Planned inflow",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[18px] px-4 py-4"
              style={{ background: "var(--bg-surface-2)", border: "1px solid var(--border)" }}
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-4)" }}>
                {item.label}
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-[-0.05em]" style={{ color: "var(--text-1)" }}>
                {item.value}
              </div>
              <div className="mt-1 text-xs" style={{ color: "var(--text-3)" }}>
                {item.note}
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside className="surface-panel rounded-[24px] px-5 py-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold tracking-[-0.02em]">Workspace status</div>
            <div className="mt-1 text-xs" style={{ color: "var(--text-4)" }}>
              Live view
            </div>
          </div>
          <div className="linear-tag">{clock ? formatDashboardTime(clock) : "--:--:--"}</div>
        </div>

        <div className="mt-5 space-y-4">
          {[
            {
              label: "Promises due",
              value: data ? `${formatIndian(data.weekForecast.promisesDue)}` : "Loading",
              tone: "var(--text-1)",
            },
            {
              label: "Overdue risk",
              value: data ? `${formatIndian(data.weekForecast.overdueRisk)}` : "Loading",
              tone: "var(--danger)",
            },
            {
              label: "Collection rate",
              value: data ? `${data.collectionRate}%` : "Loading",
              tone: "var(--accent)",
            },
          ].map((item, index) => (
            <div
              key={item.label}
              className={index === 0 ? "" : "border-t pt-4"}
              style={{ borderColor: "var(--border)" }}
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-4)" }}>
                {item.label}
              </div>
              <div className="mt-2 text-lg font-semibold tracking-[-0.03em]" style={{ color: item.tone }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {activeModules.length > 0 ? (
          <div className="mt-6 border-t pt-5" style={{ borderColor: "var(--border)" }}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-4)" }}>
              Active modules
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {activeModules.map((module) => (
                <span key={module.id} className="linear-tag">
                  {module.label}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </aside>
    </section>
  );
}
