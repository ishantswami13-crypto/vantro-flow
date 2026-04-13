"use client";

import { useEffect, useState } from "react";
import DashboardHero from "./DashboardHero";
import DashboardOverview, { DashboardSkeleton } from "./DashboardOverview";
import DashboardCharts from "./DashboardCharts";
import DashboardCollectionsBoard from "./DashboardCollectionsBoard";
import type { DashboardPayload } from "./types";
import { useClock } from "./hooks";

export default function DashboardShell() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedInvoiceIds, setResolvedInvoiceIds] = useState<Set<number>>(new Set());
  const clock = useClock();

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      try {
        const response = await fetch("/api/dashboard");
        if (!response.ok) {
          throw new Error("Failed to load dashboard data");
        }

        const result: DashboardPayload = await response.json();
        if (!ignore) {
          setData(result);
        }
      } catch (error) {
        if (!ignore) {
          setError(error instanceof Error ? error.message : "Failed to load dashboard data");
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
  }, []);

  const visibleFollowUps = data?.followUpList.filter((item) => !resolvedInvoiceIds.has(item.id)).length ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <DashboardHero clock={clock} data={data} visibleFollowUps={visibleFollowUps} />

      {error && !data ? (
        <div
          className="mb-8 rounded-[28px] px-5 py-4"
          style={{
            background: "var(--coral-light)",
            border: "1px solid rgba(229,53,74,0.16)",
            color: "var(--coral)",
          }}
        >
          {error}
        </div>
      ) : null}

      {loading && !data ? (
        <DashboardSkeleton />
      ) : data ? (
        <>
          <DashboardOverview data={data} visibleFollowUps={visibleFollowUps} />
          <DashboardCharts data={data} />
          <DashboardCollectionsBoard
            data={data}
            resolvedInvoiceIds={resolvedInvoiceIds}
            setResolvedInvoiceIds={setResolvedInvoiceIds}
          />
        </>
      ) : null}
    </div>
  );
}
