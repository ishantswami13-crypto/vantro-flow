"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import DashboardHero from "./DashboardHero";
import DashboardOverview, { DashboardSkeleton } from "./DashboardOverview";
const DashboardCharts = dynamic(() => import("./DashboardCharts"), { ssr: false });
const DashboardCollectionsBoard = dynamic(() => import("./DashboardCollectionsBoard"), { ssr: false });
import type { DashboardPayload } from "./types";
import { useClock } from "./hooks";

function DashboardEmptyState({ onDemoLoaded }: { onDemoLoaded: () => void }) {
  const [seeding, setSeeding] = useState(false);

  async function handleLoadDemo() {
    setSeeding(true);
    try {
      await fetch("/api/seed-demo", { method: "POST" });
      onDemoLoaded();
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-5 text-6xl">📊</div>
      <h2
        className="text-[2rem] font-semibold tracking-[-0.04em]"
        style={{ color: "var(--text-1)" }}
      >
        Welcome to Vantro Flow
      </h2>
      <p className="mt-3 max-w-md text-base leading-7" style={{ color: "var(--text-3)" }}>
        Upload your invoices to see your collections dashboard come alive with real data.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/upload"
          className="apple-button apple-button-primary px-5 py-2.5 text-sm font-semibold"
        >
          Upload CSV
        </Link>
        <button
          onClick={handleLoadDemo}
          disabled={seeding}
          className="apple-button apple-button-secondary px-5 py-2.5 text-sm font-medium"
          style={{ color: "var(--text-2)" }}
        >
          {seeding ? "Loading…" : "Load Demo Data"}
        </button>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3 max-w-lg mx-auto">
        {[
          { icon: "📋", label: "Daily Follow-up", desc: "Never miss a payment reminder" },
          { icon: "🤖", label: "AI Reminders", desc: "Smart messages via WhatsApp" },
          { icon: "📈", label: "Cash Forecast", desc: "Know your inflow in advance" },
        ].map((f) => (
          <div
            key={f.label}
            className="rounded-[16px] p-5 text-center"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div className="mb-2 text-2xl">{f.icon}</div>
            <div className="text-xs font-semibold" style={{ color: "var(--text-2)" }}>
              {f.label}
            </div>
            <div className="mt-1 text-xs leading-5" style={{ color: "var(--text-4)" }}>
              {f.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardShell() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [resolvedInvoiceIds, setResolvedInvoiceIds] = useState<Set<number>>(new Set());
  const clock = useClock();

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    async function loadDashboard() {
      try {
        const response = await fetch("/api/dashboard");
        if (!response.ok) {
          throw new Error("Failed to load dashboard data");
        }

        const result: DashboardPayload = await response.json();
        if (!ignore) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard data");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  const isEmpty = !loading && !!data && data.activeCustomers === 0 && data.totalOutstanding === 0;
  const visibleFollowUps = data?.followUpList.filter((item) => !resolvedInvoiceIds.has(item.id)).length ?? 0;
  const selectedModules = data?.organization.selectedModules ?? [];
  const showCharts = selectedModules.includes("portfolio_analytics");
  const showCollectionsBoard =
    selectedModules.includes("daily_followups") ||
    selectedModules.includes("payment_reminders") ||
    selectedModules.includes("promises_tracking");

  return (
    <div className="mx-auto max-w-[1380px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {!isEmpty && <DashboardHero clock={clock} data={data} visibleFollowUps={visibleFollowUps} />}

      {error && !data ? (
        <div
          className="mb-6 rounded-[28px] px-5 py-4"
          style={{
            background: "var(--danger-soft)",
            border: "1px solid rgba(194,71,26,0.16)",
            color: "var(--danger)",
          }}
        >
          {error}
        </div>
      ) : null}

      {loading && !data ? (
        <DashboardSkeleton />
      ) : isEmpty ? (
        <DashboardEmptyState onDemoLoaded={() => setRefreshKey((k) => k + 1)} />
      ) : data ? (
        <>
          <DashboardOverview data={data} visibleFollowUps={visibleFollowUps} />
          {showCharts ? <DashboardCharts data={data} /> : null}
          {showCollectionsBoard ? (
            <DashboardCollectionsBoard
              data={data}
              resolvedInvoiceIds={resolvedInvoiceIds}
              setResolvedInvoiceIds={setResolvedInvoiceIds}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
