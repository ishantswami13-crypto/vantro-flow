"use client";

import { startTransition, useEffect, useState } from "react";
import { AlertTriangle, BarChart3, Gauge, PieChart, ShieldAlert, Target } from "lucide-react";
import CountUp from "@/components/CountUp";
import Reveal from "@/components/Reveal";
import { Skeleton } from "@/components/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { formatCompact } from "@/lib/format";

type AnalyticsPayload = {
  totalOutstanding: number;
  collectionRate: number;
  invoiceCount: number;
  aging: { current: number; d1to30: number; d31to60: number; d60plus: number };
  topCustomers: Array<{ name: string; outstanding: number }>;
};

const BUCKET_COLORS = ["var(--success)", "var(--warning)", "#E87B35", "var(--danger)"];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    async function load() {
      setLoading(true); setError(null);
      try {
        const res = await fetch("/api/analytics", { cache: "no-store", signal: ctrl.signal });
        if (!res.ok) throw new Error("Failed to load analytics");
        const payload = (await res.json()) as AnalyticsPayload;
        startTransition(() => setData(payload));
      } catch (err) {
        if (!ctrl.signal.aborted) setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => ctrl.abort();
  }, []);

  const agingRows = data ? [
    { label: "Current",    value: data.aging.current, color: BUCKET_COLORS[0] },
    { label: "1-30 days",  value: data.aging.d1to30,  color: BUCKET_COLORS[1] },
    { label: "31-60 days", value: data.aging.d31to60, color: BUCKET_COLORS[2] },
    { label: "60+ days",   value: data.aging.d60plus, color: BUCKET_COLORS[3] },
  ] : [];
  const maxAging = Math.max(...agingRows.map((r) => r.value), 1);
  const highRiskExposure = data ? data.aging.d31to60 + data.aging.d60plus : 0;
  const top3Exposure = data?.topCustomers.slice(0, 3).reduce((s, c) => s + c.outstanding, 0) ?? 0;
  const concentrationPct = data?.totalOutstanding ? Math.round((top3Exposure / data.totalOutstanding) * 100) : 0;
  const delayPct = data?.totalOutstanding ? Math.round((highRiskExposure / data.totalOutstanding) * 100) : 0;

  const metrics = [
    { label: "Collection rate",    value: data?.collectionRate ?? 0,  suffix: "%",  icon: Target,      color: "var(--success)",       colorSoft: "var(--success-soft)",       sub: "Paid invoices as share of total" },
    { label: "High-risk exposure", value: highRiskExposure,            prefix: "&#8377;", icon: ShieldAlert, color: "var(--danger)",        colorSoft: "var(--danger-soft)",        sub: `${delayPct}% past 31 days` },
    { label: "Delay index",        value: delayPct,                   suffix: "%",  icon: Gauge,       color: "var(--warning)",       colorSoft: "var(--warning-soft)",       sub: "Delay pressure across book" },
    { label: "Invoices tracked",   value: data?.invoiceCount ?? 0,    icon: BarChart3, color: "var(--brand-primary)", colorSoft: "var(--brand-primary-soft)", sub: "Active invoice records" },
  ];

  return (
    <main style={{ background: "var(--background)", minHeight: "100vh" }}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">

        {/* Header */}
        <Reveal>
          <div className="rounded-2xl p-6 sm:p-8"
            style={{ background: "linear-gradient(135deg, var(--brand-primary-soft) 0%, var(--surface-0) 60%)", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-sm)" }}>
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="apple-eyebrow mb-2">Portfolio Analytics</p>
                <h1 className="serif text-4xl text-[var(--text-primary)] sm:text-5xl">
                  Receivables intelligence.
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--text-tertiary)]">
                  CFO-grade visibility into aging, concentration risk, and collection performance.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Outstanding",      el: data ? <CountUp value={data.totalOutstanding} prefix="&#8377;" /> : <Skeleton width="86px" height="1.4rem" /> },
                  { label: "Collection rate",  el: data ? <CountUp value={data.collectionRate} suffix="%" /> : <Skeleton width="58px" height="1.4rem" /> },
                  { label: "Invoices",         el: data ? <CountUp value={data.invoiceCount} /> : <Skeleton width="42px" height="1.4rem" /> },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl p-3" style={{ background: "var(--surface-0)", border: "1px solid var(--border-subtle)" }}>
                    <p className="apple-eyebrow mb-1">{item.label}</p>
                    <div className="serif tabular text-lg text-[var(--text-primary)]">{item.el}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        {/* KPI Cards */}
        <Reveal delay={100}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="rounded-2xl p-5"
                  style={{ background: "var(--surface-0)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-xs)" }}>
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: m.colorSoft, color: m.color }}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <p className="apple-eyebrow mb-1">{m.label}</p>
                  <div className="serif tabular text-2xl text-[var(--text-primary)]">
                    {loading
                      ? <Skeleton width="80px" height="2rem" />
                      : <CountUp value={m.value} prefix={m.prefix} suffix={m.suffix} />}
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-tertiary)]">{m.sub}</p>
                </div>
              );
            })}
          </div>
        </Reveal>

        {/* Aging + Concentration */}
        <Reveal delay={160}>
          <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">

            {/* Aging ladder */}
            <div className="rounded-2xl p-5 sm:p-6"
              style={{ background: "var(--surface-0)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-xs)" }}>
              <p className="apple-eyebrow mb-1">Aging</p>
              <p className="serif mb-2 text-2xl text-[var(--text-primary)]">Aging ladder</p>
              <p className="mb-6 text-sm text-[var(--text-tertiary)]">
                From fresh dues to cash at serious recovery risk.
              </p>
              {loading ? (
                <div className="space-y-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} height="3rem" className="rounded-xl" />)}</div>
              ) : error ? (
                <ErrorState title="Aging data unavailable" description="Try refreshing." />
              ) : (
                <div className="space-y-5">
                  {agingRows.map((row) => {
                    const w = Math.max((row.value / maxAging) * 100, row.value > 0 ? 4 : 0);
                    return (
                      <div key={row.label}>
                        <div className="mb-2 flex items-center justify-between gap-4">
                          <span className="text-sm font-semibold text-[var(--text-primary)]">{row.label}</span>
                          <span className="serif tabular text-sm text-[var(--text-secondary)]">
                            <CountUp value={row.value} prefix="&#8377;" duration={850} />
                          </span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${w}%`, background: `linear-gradient(90deg, ${row.color} 0%, ${row.color}CC 100%)` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Top exposures */}
            <div className="rounded-2xl p-5 sm:p-6"
              style={{ background: "var(--surface-0)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-xs)" }}>
              <p className="apple-eyebrow mb-1">Concentration</p>
              <p className="serif mb-2 text-2xl text-[var(--text-primary)]">Largest exposures</p>
              <p className="mb-6 text-sm text-[var(--text-tertiary)]">
                Which accounts control your cash conversion cycle.
              </p>
              {loading ? (
                <div className="space-y-3">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} height="4rem" className="rounded-xl" />)}</div>
              ) : error ? (
                <ErrorState title="Concentration data unavailable" description="Try refreshing." />
              ) : !data || data.topCustomers.length === 0 ? (
                <EmptyState icon={PieChart} title="No concentration risk." description="Largest exposures appear here once accounts have unpaid balances." />
              ) : (
                <div className="space-y-2">
                  {data.topCustomers.map((c, i) => (
                    <div key={`${c.name}-${i}`} className="flex items-center justify-between gap-4 rounded-xl border px-4 py-3"
                      style={{ borderColor: "var(--border-subtle)", background: i === 0 ? "var(--brand-primary-soft)" : "var(--surface-1)" }}>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                          Rank {i + 1}
                        </p>
                        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{c.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Outstanding</p>
                        <p className="serif tabular text-sm text-[var(--text-primary)]">
                          <CountUp value={c.outstanding} prefix="&#8377;" duration={850} />
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Reveal>

        {/* Insights */}
        <Reveal delay={220}>
          <div className="rounded-2xl p-5 sm:p-6"
            style={{ background: "var(--surface-0)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-xs)" }}>
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="apple-eyebrow mb-1">Insights</p>
                <p className="serif text-2xl text-[var(--text-primary)]">What needs your attention</p>
              </div>
              <AlertTriangle className="h-5 w-5" style={{ color: "var(--warning)" }} aria-hidden="true" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { icon: PieChart,   color: "var(--brand-primary)", colorSoft: "var(--brand-primary-soft)", title: "Concentration risk", body: `Your top 3 accounts hold ${concentrationPct}% of unpaid balance.` },
                { icon: Target,     color: "var(--danger)",        colorSoft: "var(--danger-soft)",        title: "Stuck cash", body: `${formatCompact(data?.aging.d60plus ?? 0)} is beyond 60 days overdue.` },
                { icon: ShieldAlert,color: "var(--warning)",       colorSoft: "var(--warning-soft)",       title: "Call priority", body: `${data?.topCustomers.length ?? 0} high-exposure accounts need weekly follow-up.` },
              ].map((insight) => {
                const Icon = insight.icon;
                return (
                  <div key={insight.title} className="rounded-xl p-4"
                    style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)" }}>
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ background: insight.colorSoft, color: insight.color }}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">{insight.title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-[var(--text-tertiary)]">{insight.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
