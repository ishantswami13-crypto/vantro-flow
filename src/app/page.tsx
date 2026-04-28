"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const MoneyFlow3D = dynamic(() => import("@/components/MoneyFlow3D"), {
  ssr: false,
  loading: () => null,
});
import {
  AlertTriangle,
  ArrowRight,
  Check,
  MessageCircle,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import CountUp from "@/components/CountUp";
import { Skeleton } from "@/components/Skeleton";
import { useToast } from "@/components/Toast";
import ErrorState from "@/components/ui/ErrorState";
import type { DashboardPayload } from "@/components/dashboard/types";
import { formatCompact, formatINR, getRiskLevel } from "@/lib/format";

function outstanding(item: DashboardPayload["followUpList"][number]) {
  return Math.max(Number(item.amount) - Number(item.amountPaid ?? 0), 0);
}

function greeting(date: Date | null) {
  const h = date?.getHours() ?? 10;
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function fmtDate(d: Date | null) {
  if (!d) return "";
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

function fmtTime(d: Date | null) {
  if (!d) return "";
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function Sparkline({ values, color, height = 32 }: { values: number[]; color: string; height?: number }) {
  if (!values.length) return null;
  const w = 120; const h = height;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => {
    const x = (i / Math.max(values.length - 1, 1)) * w;
    const y = h - (v / max) * h * 0.85 - 2;
    return `${x},${y}`;
  });
  const d = `M ${pts.join(" L ")}`;
  const area = `${d} L ${w},${h} L 0,${h} Z`;
  const gid = `sg${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="1000" strokeDashoffset="1000"
        style={{ animation: "draw-stroke 1.4s ease forwards" }} />
    </svg>
  );
}

function CashflowChart({ data }: { data: { date: string; amount: number }[] }) {
  if (!data.length) return null;
  const W = 800; const H = 180;
  const pad = { t: 16, r: 16, b: 32, l: 16 };
  const iW = W - pad.l - pad.r; const iH = H - pad.t - pad.b;
  const max = Math.max(...data.map((d) => d.amount), 1);
  const pts = data.map((d, i) => ({
    x: pad.l + (i / Math.max(data.length - 1, 1)) * iW,
    y: pad.t + iH - (d.amount / max) * iH,
    ...d,
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${pad.t + iH} L ${pts[0].x} ${pad.t + iH} Z`;
  const gridYs = [0.25, 0.5, 0.75, 1].map((f) => pad.t + iH - f * iH);
  const todayX = pts[Math.floor(pts.length / 2)]?.x ?? W / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity="0.14" />
          <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridYs.map((y) => (
        <line key={y} x1={pad.l} y1={y} x2={W - pad.r} y2={y}
          stroke="var(--border-subtle)" strokeDasharray="4 4" strokeWidth="1" />
      ))}
      <line x1={todayX} y1={pad.t} x2={todayX} y2={pad.t + iH}
        stroke="var(--brand-primary)" strokeWidth="1" strokeDasharray="4 3" opacity="0.4" />
      <path d={areaPath} fill="url(#chartGrad)" />
      <path d={linePath} fill="none" stroke="var(--brand-primary)" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="1000" strokeDashoffset="1000"
        style={{ animation: "draw-stroke 1.8s ease forwards" }} />
      {pts.filter((_, i) => i === 0 || i === Math.floor(pts.length / 2) || i === pts.length - 1).map((p) => (
        <text key={p.date} x={p.x} y={H - 6} textAnchor="middle" fontSize="10"
          fill="var(--text-muted)" fontFamily="JetBrains Mono, monospace">
          {new Date(p.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
        </text>
      ))}
    </svg>
  );
}

function AgingBar({ buckets }: { buckets: DashboardPayload["agingBuckets"] }) {
  const segments = [
    { key: "current",     amount: buckets.current.amount,     count: buckets.current.count,     color: "var(--success)", label: "Current" },
    { key: "aging1to30",  amount: buckets.aging1to30.amount,  count: buckets.aging1to30.count,  color: "var(--warning)", label: "1–30 days" },
    { key: "aging31to60", amount: buckets.aging31to60.amount, count: buckets.aging31to60.count, color: "#E87B35",         label: "31–60 days" },
    { key: "aging60plus", amount: buckets.aging60plus.amount, count: buckets.aging60plus.count, color: "var(--danger)",  label: "60+ days" },
  ];
  const total = segments.reduce((s, seg) => s + seg.amount, 0) || 1;
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
        {segments.map((seg) => {
          const pct = (seg.amount / total) * 100;
          if (pct < 0.5) return null;
          return <div key={seg.key} style={{ width: `${pct}%`, background: seg.color, animation: "bar-grow 1s ease forwards" }} />;
        })}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {segments.map((seg) => (
          <div key={seg.key}>
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
              <span className="h-2 w-2 rounded-full" style={{ background: seg.color }} />
              {seg.label}
            </div>
            <p className="serif mt-1 text-base tabular text-[var(--text-primary)]">{formatCompact(seg.amount)}</p>
            <p className="mono text-[10px] text-[var(--text-muted)]">{seg.count} invoices</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PriorityRow({
  item, expanded, onToggle, onRemind,
}: {
  item: DashboardPayload["followUpList"][number];
  expanded: boolean;
  onToggle: () => void;
  onRemind: () => void;
}) {
  const owed = outstanding(item);
  const days = item.daysOverdue ?? 0;
  const level = getRiskLevel(days);
  const severityBg    = level === "critical" ? "var(--danger-soft)"  : level === "high" ? "var(--warning-soft)" : "var(--brand-primary-soft)";
  const severityColor = level === "critical" ? "var(--danger)"       : level === "high" ? "var(--warning)"      : "var(--brand-primary)";
  return (
    <div style={{ borderBottom: "1px solid var(--border-subtle)" }} className="last:border-0">
      <button type="button" onClick={onToggle}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--surface-1)]"
        aria-expanded={expanded}>
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
          style={{ background: severityBg, color: severityColor }}>
          {initials(item.customerName)}
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2"
            style={{ background: severityColor, borderColor: "var(--surface-0)" }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{item.customerName}</p>
          <p className="mono truncate text-xs text-[var(--text-muted)]">{item.invoiceNumber} · {days}d overdue</p>
        </div>
        <p className="serif shrink-0 tabular text-base text-[var(--text-primary)]">{formatCompact(owed)}</p>
        <div className="hidden shrink-0 items-center gap-1.5 sm:flex" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={onRemind}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
            style={{ background: "var(--brand-primary)" }}>
            <MessageCircle className="h-3 w-3" aria-hidden="true" />
            Remind
          </button>
        </div>
      </button>
      {expanded && (
        <div className="px-5 pb-5" style={{ animation: "scale-in 0.2s ease" }}>
          <div className="rounded-xl p-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)" }}>
            <div className="mb-4 grid grid-cols-3 gap-3">
              {([["Outstanding", formatINR(owed)], ["Days overdue", `${days}d`], ["Invoice", item.invoiceNumber]] as [string, string][]).map(([label, value]) => (
                <div key={label} className="rounded-lg p-3" style={{ background: "var(--surface-0)" }}>
                  <p className="mono text-lg font-semibold text-[var(--text-primary)]">{value}</p>
                  <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onRemind}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: "var(--brand-primary)" }}>
                <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                Send reminder
              </button>
              <Link href={`/customers/${item.customerId}`}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition hover:bg-[var(--surface-2)]"
                style={{ border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
                Open ledger <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setNow(new Date());
    const iv = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    async function load() {
      setLoading(true); setError(null);
      try {
        const res = await fetch("/api/dashboard", { cache: "no-store", signal: ctrl.signal });
        if (!res.ok) throw new Error("Failed to load dashboard");
        setData((await res.json()) as DashboardPayload);
      } catch (err) {
        if (!ctrl.signal.aborted) setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => ctrl.abort();
  }, []);

  const sparklineValues = useMemo(() => (data?.last7Days ?? []).map((d) => d.amount), [data]);
  const overdueAmount = useMemo(() => {
    if (!data) return 0;
    const { aging1to30, aging31to60, aging60plus } = data.agingBuckets;
    return aging1to30.amount + aging31to60.amount + aging60plus.amount;
  }, [data]);
  const highRiskCount = useMemo(
    () => (data?.followUpList ?? []).filter((x) => (x.daysOverdue ?? 0) > 30).length,
    [data]
  );
  const urgentCount = (data?.followUpList ?? []).filter((x) => (x.daysOverdue ?? 0) > 0).length;
  const firstName = data?.organization.name.split(" ")[0] ?? "there";

  async function handleRemind(item: DashboardPayload["followUpList"][number]) {
    try {
      await fetch("/api/remind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: item.customerId, invoice_id: item.id }),
      });
      toast({ type: "success", message: `Reminder sent for ${item.customerName}` });
    } catch {
      toast({ type: "error", message: "Failed to send reminder" });
    }
  }

  const kpis = [
    { label: "Total Receivables",  value: data?.totalOutstanding ?? 0,              icon: Wallet,      color: "var(--brand-primary)", colorSoft: "var(--brand-primary-soft)", trend: "+12%",              trendUp: true,  sub: `${data?.activeCustomers ?? 0} active customers`, isCount: false },
    { label: "Overdue Amount",      value: overdueAmount,                             icon: AlertTriangle, color: "var(--danger)",       colorSoft: "var(--danger-soft)",        trend: "-8%",               trendUp: false, sub: "Past due date",                            isCount: false },
    { label: "Expected This Week",  value: data?.weekForecast.expectedThisWeek ?? 0, icon: TrendingUp,  color: "var(--success)",       colorSoft: "var(--success-soft)",       trend: "+5%",               trendUp: true,  sub: "Forecast",                                 isCount: false },
    { label: "High-Risk Accounts",  value: highRiskCount,                             icon: ShieldAlert, color: "var(--warning)",       colorSoft: "var(--warning-soft)",       trend: String(highRiskCount), trendUp: false, sub: "30+ days overdue",                        isCount: true  },
  ];

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <ErrorState title="Dashboard could not load" description={error} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <MoneyFlow3D />

      {/* HERO */}
      <div className="animate-fade-up flex items-start justify-between gap-4">
        <div>
          <p className="apple-eyebrow mb-2">Overview · {fmtDate(now)}</p>
          <h1 className="serif text-4xl text-[var(--text-primary)] sm:text-5xl">
            Good {greeting(now)},{" "}
            <span style={{ color: "var(--brand-primary)" }}>{firstName}.</span>
          </h1>
          {loading ? (
            <Skeleton width="260px" height="1.1rem" className="mt-2" />
          ) : (
            <p className="mt-2 text-sm text-[var(--text-tertiary)]">
              {urgentCount > 0
                ? `${urgentCount} account${urgentCount === 1 ? "" : "s"} need your attention today.`
                : "All accounts current."}
            </p>
          )}
        </div>
        <div className="hidden shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold sm:flex"
          style={{ background: "var(--success-soft)", color: "var(--success)", border: "1px solid var(--success-soft)" }}>
          <span className="live-pulse h-2 w-2 rounded-full" style={{ background: "var(--success)" }} />
          Live · {fmtTime(now)}
        </div>
      </div>

      {/* AI BRIEFING */}
      <div className="animate-fade-up delay-100 overflow-hidden rounded-2xl p-6"
        style={{ background: "linear-gradient(135deg, var(--brand-primary) 0%, #005EC9 100%)", boxShadow: "0 8px 32px var(--brand-glow)" }}>
        <p className="apple-eyebrow mb-3" style={{ color: "rgba(255,255,255,0.7)", letterSpacing: "0.22em" }}>
          <Sparkles className="mr-1.5 inline h-3 w-3" aria-hidden="true" />
          AI BRIEFING · TODAY
        </p>
        {loading ? (
          <><Skeleton width="80%" height="1.8rem" className="mb-2" /><Skeleton width="60%" height="1rem" /></>
        ) : (
          <>
            <p className="serif text-2xl text-white sm:text-3xl">
              {urgentCount > 0
                ? `${urgentCount} account${urgentCount === 1 ? "" : "s"} need action. ${formatCompact(overdueAmount)} at risk of delay.`
                : "All accounts are in good standing today."}
            </p>
            {data?.followUpList[0] && (
              <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
                Most urgent: <strong style={{ color: "white" }}>{data.followUpList[0].customerName}</strong>
                {" — "}{data.followUpList[0].daysOverdue ?? 0} days overdue,{" "}
                {formatCompact(outstanding(data.followUpList[0]))} outstanding.
              </p>
            )}
          </>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button"
            onClick={() => { if (data?.followUpList[0]) void handleRemind(data.followUpList[0]); }}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition hover:opacity-90"
            style={{ background: "white", color: "var(--brand-primary)" }}>
            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Send WhatsApp message
          </button>
          <Link href="/customers"
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition hover:bg-white/10"
            style={{ color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.3)" }}>
            See action plan <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="animate-fade-up delay-150 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="rounded-2xl p-5 transition-shadow hover:shadow-[var(--shadow-sm)]"
              style={{ background: "var(--surface-0)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-xs)" }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: kpi.colorSoft, color: kpi.color }}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: kpi.trendUp ? "var(--success-soft)" : "var(--danger-soft)", color: kpi.trendUp ? "var(--success)" : "var(--danger)" }}>
                  {kpi.trendUp ? "↗" : "↘"} {kpi.trend}
                </span>
              </div>
              <p className="apple-eyebrow mb-1 mt-3">{kpi.label}</p>
              <div className="serif tabular text-2xl text-[var(--text-primary)]">
                {loading ? <Skeleton width="80px" height="2rem" /> : kpi.isCount ? <CountUp value={kpi.value} /> : <CountUp value={kpi.value} prefix="&#8377;" />}
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{kpi.sub}</p>
              <div className="mt-3"><Sparkline values={sparklineValues} color={kpi.color} /></div>
            </div>
          );
        })}
      </div>

      {/* CASHFLOW TIMELINE */}
      <div className="animate-fade-up delay-200 rounded-2xl p-5 sm:p-6"
        style={{ background: "var(--surface-0)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-xs)" }}>
        <p className="apple-eyebrow mb-1">Cashflow &middot; last 7 days</p>
        <p className="serif mb-4 text-xl text-[var(--text-primary)]">
          {loading ? <Skeleton width="160px" height="1.5rem" /> : (
            <>{formatCompact(data?.last7Days.reduce((s, d) => s + d.amount, 0) ?? 0)}{" "}
              <span className="text-sm font-normal text-[var(--text-tertiary)]">in motion</span></>
          )}
        </p>
        {loading ? <Skeleton height="180px" className="rounded-xl" /> : <CashflowChart data={data?.last7Days ?? []} />}
      </div>

      {/* AGING DISTRIBUTION */}
      <div className="animate-fade-up delay-300 rounded-2xl p-5 sm:p-6"
        style={{ background: "var(--surface-0)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-xs)" }}>
        <p className="apple-eyebrow mb-1">Aging distribution</p>
        <p className="serif mb-4 text-xl text-[var(--text-primary)]">Where your receivables stand</p>
        {loading ? <Skeleton height="4rem" className="rounded-xl" /> : data ? <AgingBar buckets={data.agingBuckets} /> : null}
      </div>

      {/* PRIORITY QUEUE */}
      <div className="animate-fade-up delay-400 overflow-hidden rounded-2xl"
        style={{ background: "var(--surface-0)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-xs)" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div>
            <p className="apple-eyebrow mb-0.5">Priority queue &middot; Today</p>
            <p className="serif text-xl text-[var(--text-primary)]">Follow-up actions</p>
          </div>
          {!loading && urgentCount > 0 && (
            <span className="rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
              {urgentCount} urgent
            </span>
          )}
        </div>
        {loading ? (
          <div className="space-y-3 p-4">
            {[0, 1, 2].map((i) => <Skeleton key={i} height="5rem" className="rounded-xl" />)}
          </div>
        ) : !data || data.followUpList.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: "var(--success-soft)" }}>
              <Check className="h-5 w-5" style={{ color: "var(--success)" }} aria-hidden="true" />
            </div>
            <p className="serif text-xl text-[var(--text-primary)]">All clear.</p>
            <p className="mt-1 text-sm text-[var(--text-tertiary)]">No overdue invoices right now.</p>
          </div>
        ) : (
          data.followUpList.map((item) => (
            <PriorityRow key={item.id} item={item}
              expanded={expanded === item.id}
              onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
              onRemind={() => void handleRemind(item)} />
          ))
        )}
      </div>
    </div>
  );
}
