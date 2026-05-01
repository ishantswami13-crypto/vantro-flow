"use client";

import { startTransition, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Activity, AlertTriangle, BarChart3, Gauge, PieChart, ShieldAlert, Target } from "lucide-react";

const AgingChart3D = dynamic(() => import("@/components/AgingChart3D"), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl" style={{ background: "#0F172A", height: 300 }} />
  ),
});
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

const BUCKET_COLORS = ["#22C55E", "#F59E0B", "#E87B35", "#EF4444"];

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
  const highRiskExposure = data ? data.aging.d31to60 + data.aging.d60plus : 0;
  const top3Exposure = data?.topCustomers.slice(0, 3).reduce((s, c) => s + c.outstanding, 0) ?? 0;
  const concentrationPct = data?.totalOutstanding ? Math.round((top3Exposure / data.totalOutstanding) * 100) : 0;
  const delayPct = data?.totalOutstanding ? Math.round((highRiskExposure / data.totalOutstanding) * 100) : 0;
  const forecastScore = data?.totalOutstanding ? Math.max(35, Math.round(95 - delayPct * 0.7 - concentrationPct * 0.18)) : 100;
  const forecastLabel = forecastScore >= 78 ? "Strong portfolio control" : forecastScore >= 58 ? "Watch collection drag" : "Risk concentration rising";

  const metrics = [
    { label: "Collection rate",    value: data?.collectionRate ?? 0,  suffix: "%",  icon: Target,      color: "var(--success)",       colorSoft: "var(--success-soft)",       sub: "Paid invoices as share of total" },
    { label: "High-risk exposure", value: highRiskExposure,            prefix: "₹", icon: ShieldAlert, color: "var(--danger)",        colorSoft: "var(--danger-soft)",        sub: `${delayPct}% past 31 days` },
    { label: "Delay index",        value: delayPct,                   suffix: "%",  icon: Gauge,       color: "var(--warning)",       colorSoft: "var(--warning-soft)",       sub: "Delay pressure across book" },
    { label: "Invoices tracked",   value: data?.invoiceCount ?? 0,    icon: BarChart3, color: "var(--brand-primary)", colorSoft: "var(--brand-primary-soft)", sub: "Active invoice records" },
  ];

  return (
    <main style={{ background: "var(--background)", minHeight: "100vh" }}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">

        {/* Header */}
        <Reveal>
          <div className="vf-command-surface rounded-[28px] p-6 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="apple-eyebrow mb-2">Portfolio Analytics</p>
                <h1 className="text-4xl font-semibold tracking-[-0.02em] text-[var(--text-primary)] sm:text-5xl">
                  CFO intelligence layer.
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--text-tertiary)]">
                  Aging, concentration, and collection performance translated into decisions.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Outstanding",      el: data ? <CountUp value={data.totalOutstanding} prefix="₹" /> : <Skeleton width="86px" height="1.4rem" /> },
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

        <Reveal delay={70}>
          <section className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-0)] p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="apple-eyebrow mb-1">Executive interpretation</p>
                <h2 className="text-2xl font-semibold tracking-[-0.01em] text-[var(--text-primary)]">{forecastLabel}</h2>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{ background: "var(--brand-primary-soft)", color: "var(--brand-primary)", border: "1px solid rgba(79,140,255,0.24)" }}>
                <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                Forecast quality {forecastScore}%
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                { label: "Concentration", value: `${concentrationPct}%`, body: "Top 3 accounts as share of unpaid balance" },
                { label: "Stuck beyond 60d", value: formatCompact(data?.aging.d60plus ?? 0), body: "Cash that needs escalation, not reminders" },
                { label: "Decision priority", value: highRiskExposure > 0 ? "Escalate" : "Monitor", body: highRiskExposure > 0 ? "High-risk exposure is active" : "No material high-risk exposure" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4">
                  <p className="apple-eyebrow mb-1">{item.label}</p>
                  <p className="serif tabular text-2xl text-[var(--text-primary)]">{item.value}</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--text-tertiary)]">{item.body}</p>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        {/* KPI Cards */}
        <Reveal delay={100}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="vf-hover-depth rounded-2xl p-5"
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
                <div className="rounded-xl" style={{ background: "#0F172A", height: 300 }} />
              ) : error ? (
                <ErrorState title="Aging data unavailable" description="Try refreshing." />
              ) : (
                <AgingChart3D
                  data={agingRows.map((r) => ({
                    label: r.label,
                    value: parseFloat((r.value / 100000).toFixed(2)),
                    color: r.color,
                  }))}
                />
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
                          <CountUp value={c.outstanding} prefix="₹" duration={850} />
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
