"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  Check,
  Clock3,
  FileUp,
  MessageCircle,
  ShieldAlert,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import CountUp from "@/components/CountUp";
import FlowLens from "@/components/FlowLens";
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

function forecastConfidence(totalOutstanding: number, overdueAmount: number, highRiskCount: number) {
  if (totalOutstanding <= 0) return { label: "No exposure", score: 100, color: "var(--success)" };
  const overduePressure = overdueAmount / totalOutstanding;
  const score = Math.max(42, Math.round(96 - overduePressure * 48 - highRiskCount * 4));
  if (score >= 78) return { label: "High confidence", score, color: "var(--success)" };
  if (score >= 60) return { label: "Watch forecast", score, color: "var(--warning)" };
  return { label: "Forecast at risk", score, color: "var(--danger)" };
}

function priorityImpact(item: DashboardPayload["followUpList"][number]) {
  const owed = outstanding(item);
  const days = item.daysOverdue ?? 0;
  if (days >= 60) return { label: `Protects ${formatCompact(owed)}`, tone: "danger", reason: "Critical overdue exposure is dragging forecast confidence." };
  if (days >= 30) return { label: `Unlocks ${formatCompact(owed)}`, tone: "warning", reason: "High-value follow-up can move cash back into this week." };
  return { label: `Improves forecast`, tone: "info", reason: "Clearing this action reduces follow-up uncertainty." };
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
  const impact = priorityImpact(item);
  const impactColor = impact.tone === "danger" ? "var(--danger)" : impact.tone === "warning" ? "var(--warning)" : "var(--brand-primary)";
  const impactSoft = impact.tone === "danger" ? "var(--danger-soft)" : impact.tone === "warning" ? "var(--warning-soft)" : "var(--brand-primary-soft)";
  return (
    <div
      style={{ borderBottom: "1px solid var(--border-subtle)", "--edge-color": severityColor, "--edge-opacity": expanded ? 1 : 0.55 } as CSSProperties}
      className="vf-risk-edge last:border-0"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onToggle();
          }
        }}
        className="flex w-full items-center gap-4 px-5 py-4 pl-6 text-left transition-colors hover:bg-[var(--surface-1)]"
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
          <p className="mt-1 hidden truncate text-xs text-[var(--text-tertiary)] sm:block">{impact.reason}</p>
        </div>
        <div className="hidden shrink-0 text-right md:block">
          <p className="serif tabular text-base text-[var(--text-primary)]">{formatCompact(owed)}</p>
          <p className="mt-1 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: impactSoft, color: impactColor }}>
            {impact.label}
          </p>
        </div>
        <div className="hidden shrink-0 items-center gap-1.5 sm:flex" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={onRemind}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
            style={{ background: "var(--brand-primary)" }}>
            <MessageCircle className="h-3 w-3" aria-hidden="true" />
            Remind
          </button>
        </div>
      </div>
      {expanded && (
        <div className="px-5 pb-5 pl-6" style={{ animation: "scale-in 0.2s ease" }}>
          <div className="rounded-xl p-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)" }}>
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {([["Outstanding", formatINR(owed)], ["Days overdue", `${days}d`], ["Impact", impact.label], ["Risk movement", days >= 45 ? "Increased" : "Stable"]] as [string, string][]).map(([label, value]) => (
                <div key={label} className="rounded-lg p-3" style={{ background: "var(--surface-0)" }}>
                  <p className="mono text-sm font-semibold text-[var(--text-primary)] sm:text-base">{value}</p>
                  <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
                </div>
              ))}
            </div>
            <div className="mb-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] p-4">
              <p className="apple-eyebrow mb-3">Invoice-to-cash timeline</p>
              <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-semibold text-[var(--text-tertiary)]">
                {["Created", "Sent", "Due", days > 0 ? "Overdue" : "Current", "Action"].map((step, idx) => (
                  <div key={step} className="relative">
                    <div className="mx-auto mb-2 h-2.5 w-2.5 rounded-full" style={{ background: idx >= 3 && days > 0 ? severityColor : "var(--brand-primary)" }} />
                    {idx < 4 && <span className="absolute left-1/2 top-[5px] h-px w-full bg-[var(--border-subtle)]" aria-hidden="true" />}
                    {step}
                  </div>
                ))}
              </div>
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
  const stuckAmount = data ? data.agingBuckets.aging1to30.amount + data.agingBuckets.aging31to60.amount : 0;
  const atRiskAmount = data?.agingBuckets.aging60plus.amount ?? 0;
  const confidence = forecastConfidence(data?.totalOutstanding ?? 0, overdueAmount, highRiskCount);
  const expectedInflow = (data?.weekForecast.expectedThisWeek ?? 0) + (data?.weekForecast.promisesDue ?? 0);
  const hasNoSignal = !loading && !!data && data.totalOutstanding === 0 && data.followUpList.length === 0;

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
      {/* HERO */}
      <div className="animate-fade-up flex items-start justify-between gap-4">
        <div>
          <p className="apple-eyebrow mb-2">Command Center · {fmtDate(now)}</p>
          <h1 className="max-w-[12ch] text-[2.55rem] font-semibold leading-[0.98] tracking-[-0.02em] text-[var(--text-primary)] sm:max-w-none sm:text-5xl">
            Today&apos;s Financial Command
          </h1>
          {loading ? (
            <Skeleton width="260px" height="1.1rem" className="mt-2" />
          ) : (
            <p className="mt-2 text-sm text-[var(--text-tertiary)]">
              {urgentCount > 0
                ? `Good ${greeting(now)}, ${firstName}. ${formatCompact(data?.totalOutstanding ?? 0)} is in motion, ${formatCompact(overdueAmount)} needs attention, and ${urgentCount} account${urgentCount === 1 ? "" : "s"} require action.`
                : `Good ${greeting(now)}, ${firstName}. Your receivables book is calm today.`}
            </p>
          )}
        </div>
        <div className="hidden shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold sm:flex"
          style={{ background: "var(--success-soft)", color: "var(--success)", border: "1px solid var(--success-soft)" }}>
          <span className="live-pulse h-2 w-2 rounded-full" style={{ background: "var(--success)" }} />
          Live · {fmtTime(now)}
        </div>
      </div>

      {/* DAILY CFO BRIEF */}
      <section className="vf-command-surface animate-fade-up delay-100 rounded-[28px] p-6 sm:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="apple-eyebrow">
            <Bot className="mr-1.5 inline h-3.5 w-3.5" aria-hidden="true" />
            Daily CFO Brief
          </p>
          <div className="flex w-full items-center justify-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold sm:w-auto"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border-subtle)", color: confidence.color }}>
            <Activity className="h-3.5 w-3.5" aria-hidden="true" />
            {confidence.label} · {confidence.score}%
          </div>
        </div>
        {loading ? (
          <><Skeleton width="80%" height="1.8rem" className="mb-2" /><Skeleton width="60%" height="1rem" /></>
        ) : (
          <>
            <p className="max-w-5xl text-2xl font-semibold leading-tight tracking-[-0.02em] text-[var(--text-primary)] sm:text-4xl">
              {urgentCount > 0
                ? `${formatCompact(data?.totalOutstanding ?? 0)} is open. ${formatCompact(overdueAmount)} is overdue. ${urgentCount} account${urgentCount === 1 ? "" : "s"} need action before the forecast gets weaker.`
                : `${formatCompact(data?.totalOutstanding ?? 0)} is open and the book is stable. Keep watch on upcoming dues to protect this week's inflow.`}
            </p>
            {data?.followUpList[0] && (
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-tertiary)]">
                Most urgent: <strong className="text-[var(--text-primary)]">{data.followUpList[0].customerName}</strong>
                {" — "}{data.followUpList[0].daysOverdue ?? 0} days overdue with{" "}
                {formatCompact(outstanding(data.followUpList[0]))} outstanding. Recommended next move: call first, then send a written payment promise request.
              </p>
            )}
          </>
        )}
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            { icon: Wallet, label: "Money in motion", value: formatCompact(data?.totalOutstanding ?? 0), detail: `${data?.activeCustomers ?? 0} active accounts` },
            { icon: Clock3, label: "Expected inflow", value: formatCompact(expectedInflow), detail: "This week + promises" },
            { icon: Target, label: "Priority impact", value: urgentCount ? `${urgentCount} actions` : "Clear", detail: urgentCount ? "Protect today's forecast" : "No urgent queue" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-glass)] p-4">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "var(--brand-primary-soft)", color: "var(--brand-primary)" }}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <p className="apple-eyebrow mb-1">{item.label}</p>
                <p className="serif tabular text-2xl text-[var(--text-primary)]">{item.value}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{item.detail}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button"
            onClick={() => { if (data?.followUpList[0]) void handleRemind(data.followUpList[0]); }}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition hover:opacity-90"
            style={{ background: "var(--brand-primary)", color: "white" }}>
            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Send first reminder
          </button>
          <Link href="/customers"
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition hover:bg-white/10"
            style={{ color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}>
            Open account intelligence <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {hasNoSignal && (
        <section className="animate-fade-up delay-150 rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-0)] p-5 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="apple-eyebrow mb-2">Activation signal</p>
              <h2 className="text-2xl font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
                Your command center is waiting for financial data.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-tertiary)]">
                Upload invoices to activate Flow Lens, priority impact, account risk, and weekly cash visibility.
              </p>
            </div>
            <Link
              href="/upload"
              className="magnetic inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white"
              style={{ background: "var(--brand-primary)", boxShadow: "0 14px 34px var(--brand-glow)" }}
            >
              <FileUp className="h-4 w-4" aria-hidden="true" />
              Upload first invoice
            </Link>
          </div>
        </section>
      )}

      {/* KPI ROW */}
      <div className="animate-fade-up delay-150 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="vf-data-card vf-hover-depth rounded-2xl p-5">
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
                {loading ? <Skeleton width="80px" height="2rem" /> : kpi.isCount ? <CountUp value={kpi.value} /> : <CountUp value={kpi.value} prefix="₹" />}
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{kpi.sub}</p>
              <div className="mt-3"><Sparkline values={sparklineValues} color={kpi.color} /></div>
            </div>
          );
        })}
      </div>

      <div id="flow-lens" className="animate-fade-up delay-200">
        {loading ? (
          <Skeleton height="24rem" className="rounded-[28px]" />
        ) : (
          <FlowLens
            moving={data?.collectedThisMonth ?? 0}
            expected={expectedInflow}
            stuck={stuckAmount}
            atRisk={atRiskAmount}
          />
        )}
      </div>

      {/* CASHFLOW TIMELINE */}
      <div className="vf-quiet-panel animate-fade-up delay-300 rounded-2xl p-5 sm:p-6">
        <p className="apple-eyebrow mb-1">Cashflow &middot; last 7 days</p>
        <div className="serif mb-4 text-xl text-[var(--text-primary)]">
          {loading ? <Skeleton width="160px" height="1.5rem" /> : (
            <>{formatCompact(data?.last7Days.reduce((s, d) => s + d.amount, 0) ?? 0)}{" "}
              <span className="text-sm font-normal text-[var(--text-tertiary)]">in motion</span></>
          )}
        </div>
        {loading ? <Skeleton height="180px" className="rounded-xl" /> : <CashflowChart data={data?.last7Days ?? []} />}
      </div>

      {/* AGING DISTRIBUTION */}
      <div className="vf-quiet-panel animate-fade-up delay-400 rounded-2xl p-5 sm:p-6">
        <p className="apple-eyebrow mb-1">Aging distribution</p>
        <p className="serif mb-4 text-xl text-[var(--text-primary)]">Where your receivables stand</p>
        {loading ? <Skeleton height="4rem" className="rounded-xl" /> : data ? <AgingBar buckets={data.agingBuckets} /> : null}
      </div>

      {/* PRIORITY QUEUE */}
      <div id="priority-queue" className="vf-quiet-panel animate-fade-up delay-500 overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div>
            <p className="apple-eyebrow mb-0.5">Priority Impact Engine &middot; Today</p>
            <p className="serif text-xl text-[var(--text-primary)]">Actions ranked by cash impact</p>
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
