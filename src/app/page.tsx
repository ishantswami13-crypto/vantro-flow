"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  MessageCircle,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { DashboardPayload } from "@/components/dashboard/types";
import CountUp from "@/components/CountUp";
import Reveal from "@/components/Reveal";
import { useToast } from "@/components/Toast";

type FollowUpItem = DashboardPayload["followUpList"][number];

type Severity = "critical" | "high" | "medium";

const SEVERITY_CONFIG: Record<Severity, { dot: string; bg: string; text: string }> = {
  critical: { dot: "var(--coral)", bg: "var(--coral-wash)", text: "var(--coral)" },
  high: { dot: "#EA580C", bg: "#FFF7ED", text: "#EA580C" },
  medium: { dot: "var(--amber)", bg: "var(--amber-wash)", text: "var(--amber)" },
};

function formatIndian(value: string | number | null | undefined) {
  const number = typeof value === "number" ? value : Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number.isFinite(number) ? number : 0);
}

function outstandingFor(item: FollowUpItem) {
  return Math.max(Number(item.amount) - Number(item.amountPaid ?? 0), 0);
}

function getTimeOfDay(date: Date | null) {
  const hour = date?.getHours() ?? 10;
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function buildChartPoints(values: number[]) {
  const max = Math.max(...values, 1);
  const width = 800;
  const step = width / Math.max(values.length - 1, 1);

  return values
    .map((value, index) => {
      const x = Math.round(index * step);
      const y = Math.round(22 + (1 - value / max) * 158);
      return `L ${x} ${y}`;
    })
    .join(" ");
}

function safePercent(amount: number, total: number) {
  if (total <= 0 || amount <= 0) {
    return 0;
  }

  return Math.max((amount / total) * 100, 2);
}

function Sparkline({ path, color }: { path: string; color: string }) {
  return (
    <svg viewBox="0 0 100 24" className="h-6 w-full" aria-hidden="true">
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        style={{ strokeDasharray: 1000, animation: "draw-stroke 1.5s ease-out forwards" }}
      />
      <path d={`${path} L 100 24 L 0 24 Z`} fill={color} opacity=".08" />
    </svg>
  );
}

function LoadingDashboard() {
  return (
    <main className="min-h-[calc(100vh-60px)] bg-[var(--bg)]">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-10 h-36 rounded-3xl shimmer" />
        <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-40 rounded-2xl shimmer" />
          ))}
        </div>
        <div className="h-72 rounded-2xl shimmer" />
      </div>
    </main>
  );
}

function EmptyDashboard({ onReload }: { onReload: () => void }) {
  const [seeding, setSeeding] = useState(false);

  async function loadDemoData() {
    setSeeding(true);
    try {
      await fetch("/api/reseed");
      onReload();
    } finally {
      setSeeding(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-60px)] bg-[var(--bg)]">
      <div className="mx-auto flex max-w-7xl flex-col items-center px-6 py-20 text-center">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--sage-wash)]">
          <Check className="h-5 w-5 text-[var(--sage)]" aria-hidden="true" />
        </div>
        <p className="mb-2 text-[11px] uppercase tracking-[.2em] text-[var(--ink-3)]">Dashboard</p>
        <h1 className="serif mb-3 text-5xl text-[var(--ink)]">Ready for live collections.</h1>
        <p className="max-w-md text-[15px] leading-relaxed text-[var(--ink-3)]">
          Add invoices or load the demo portfolio to see the AI briefing, aging bars, cash forecast, and priority queue.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={loadDemoData}
            disabled={seeding}
            className="rounded-full bg-[var(--teal)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--teal-dark)]"
          >
            {seeding ? "Loading data" : "Load demo data"}
          </button>
          <Link
            href="/upload"
            className="rounded-full px-5 py-2.5 text-sm font-medium text-[var(--ink-2)] transition hover:bg-[var(--surface-2)]"
          >
            Upload CSV
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function HomePage() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [now, setNow] = useState<Date | null>(null);
  const [resolved, setResolved] = useState<Set<number>>(new Set());
  const [reminded, setReminded] = useState<Set<number>>(new Set());
  const [promised, setPromised] = useState<Set<number>>(new Set());
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [period, setPeriod] = useState("14d");
  const { toast } = useToast();

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      setLoading(true);

      try {
        const response = await fetch("/api/dashboard", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load dashboard data");
        }

        const result = (await response.json()) as DashboardPayload;
        if (!ignore) {
          setData(result);
          setError(null);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard data");
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

  const followUp = useMemo(
    () => (data?.followUpList ?? []).filter((item) => !resolved.has(item.id)),
    [data?.followUpList, resolved]
  );

  const topPriority = followUp[0] ?? null;
  const priorityCount = followUp.length;
  const expectedInflow = data ? data.weekForecast.expectedThisWeek + data.weekForecast.promisesDue : 0;
  const formattedTime = now?.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }) ?? "--:--";
  const dateString =
    now?.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }) ?? "Today";
  const todayDate = now?.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) ?? "Today";

  const kpis = data
    ? [
        {
          label: "Outstanding",
          rawValue: data.totalOutstanding,
          prefix: "₹",
          suffix: "",
          change: "+12%",
          trendUp: false,
          Icon: TrendingDown,
          iconBg: "var(--coral-wash)",
          iconColor: "var(--coral)",
          sparkPath: "M 0 12 L 20 14 L 40 10 L 60 8 L 80 4 L 100 2",
        },
        {
          label: "Recovered",
          rawValue: data.collectedThisMonth,
          prefix: "₹",
          suffix: "",
          change: "+24%",
          trendUp: true,
          Icon: TrendingUp,
          iconBg: "var(--sage-wash)",
          iconColor: "var(--sage)",
          sparkPath: "M 0 20 L 20 16 L 40 14 L 60 8 L 80 6 L 100 4",
        },
        {
          label: "Active accounts",
          rawValue: data.activeCustomers,
          prefix: "",
          suffix: "",
          change: "+2",
          trendUp: true,
          Icon: Users,
          iconBg: "var(--teal-wash)",
          iconColor: "var(--teal)",
          sparkPath: "M 0 16 L 25 14 L 50 12 L 75 10 L 100 8",
        },
        {
          label: "Recovery rate",
          rawValue: data.collectionRate,
          prefix: "",
          suffix: "%",
          change: "+5%",
          trendUp: true,
          Icon: Target,
          iconBg: "var(--amber-wash)",
          iconColor: "var(--amber)",
          sparkPath: "M 0 18 L 25 14 L 50 12 L 75 8 L 100 6",
        },
      ]
    : [];

  const chartValues = useMemo(() => {
    const history = data?.last7Days.map((item) => item.amount) ?? [];
    const base = Math.max(expectedInflow, data?.totalOutstanding ?? 0, 1);
    return [
      ...history,
      Math.round(base * 0.18),
      Math.round(base * 0.28),
      Math.round(base * 0.38),
      Math.round(base * 0.5),
      Math.round(base * 0.62),
      Math.round(base * 0.78),
      Math.round(base * 0.92),
    ].slice(-14);
  }, [data?.last7Days, data?.totalOutstanding, expectedInflow]);

  const chartPoints = buildChartPoints(chartValues);
  const chartLine = `M 0 180 ${chartPoints}`;
  const chartArea = `${chartLine} L 800 200 L 0 200 Z`;

  const agingTotal = data
    ? data.agingBuckets.current.amount +
      data.agingBuckets.aging1to30.amount +
      data.agingBuckets.aging31to60.amount +
      data.agingBuckets.aging60plus.amount
    : 0;

  const agingItems = data
    ? [
        {
          label: "Current",
          amount: data.agingBuckets.current.amount,
          count: data.agingBuckets.current.count,
          color: "var(--teal)",
          pct: safePercent(data.agingBuckets.current.amount, agingTotal),
        },
        {
          label: "1-30",
          amount: data.agingBuckets.aging1to30.amount,
          count: data.agingBuckets.aging1to30.count,
          color: "var(--amber)",
          pct: safePercent(data.agingBuckets.aging1to30.amount, agingTotal),
        },
        {
          label: "31-60",
          amount: data.agingBuckets.aging31to60.amount,
          count: data.agingBuckets.aging31to60.count,
          color: "#EA580C",
          pct: safePercent(data.agingBuckets.aging31to60.amount, agingTotal),
        },
        {
          label: "60+",
          amount: data.agingBuckets.aging60plus.amount,
          count: data.agingBuckets.aging60plus.count,
          color: "var(--coral)",
          pct: safePercent(data.agingBuckets.aging60plus.amount, agingTotal),
        },
      ]
    : [];

  async function handlePaid(invoiceId: number) {
    setActionLoading(invoiceId);
    try {
      await fetch(`/api/invoice/${invoiceId}/paid`, { method: "POST" });
      setResolved((current) => new Set(current).add(invoiceId));
      toast({ type: "success", message: "Invoice marked as paid" });
    } catch {
      toast({ type: "error", message: "Failed to update invoice" });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRemind(invoiceId: number, customerId: number) {
    setActionLoading(invoiceId);
    try {
      await fetch("/api/remind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_id: invoiceId, customer_id: customerId }),
      });
      setReminded((current) => new Set(current).add(invoiceId));
      toast({ type: "info", message: "WhatsApp reminder queued" });
    } catch {
      toast({ type: "error", message: "Failed to send reminder" });
    } finally {
      setActionLoading(null);
    }
  }

  function handlePromise(invoiceId: number) {
    setPromised((current) => new Set(current).add(invoiceId));
    toast({ type: "info", message: "Promise recorded" });
  }

  if (loading && !data) {
    return <LoadingDashboard />;
  }

  if (!loading && (!data || (data.activeCustomers === 0 && data.totalOutstanding === 0))) {
    return <EmptyDashboard onReload={() => setRefreshKey((key) => key + 1)} />;
  }

  return (
    <main className="min-h-[calc(100vh-60px)] bg-[var(--bg)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {error ? (
          <div className="mb-6 rounded-2xl border border-[var(--coral-light)] bg-[var(--coral-wash)] px-4 py-3 text-sm text-[var(--coral)]">
            {error}
          </div>
        ) : null}

        <Reveal>
        <section className="mb-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-3 text-[11px] uppercase tracking-[.2em] text-[var(--ink-3)]">
                Dashboard · {dateString}
              </p>
              <h1 className="serif mb-3 text-4xl leading-[.98] text-[var(--ink)] sm:text-5xl md:text-6xl">
                Good {getTimeOfDay(now)}, Ishant.
              </h1>
              <p className="max-w-md text-[15px] leading-relaxed text-[var(--ink-3)]">
                {priorityCount > 0
                  ? `${priorityCount} ${priorityCount === 1 ? "customer needs" : "customers need"} your attention today.`
                  : "All accounts are current. Good day to plan ahead."}
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--teal-light)] bg-[var(--teal-wash)] px-3 py-1.5">
              <span className="relative flex h-2 w-2 text-[var(--teal)]">
                <span className="live-pulse relative h-2 w-2 rounded-full bg-[var(--teal)]" />
              </span>
              <span className="mono tabular text-xs font-medium text-[var(--teal-dark)]">
                Live · {formattedTime}
              </span>
            </div>
          </div>
        </section>
        </Reveal>

        <Reveal delay={100}>
        <section className="mb-10">
          <div
            className="relative overflow-hidden rounded-3xl p-6 sm:p-8"
            style={{
              background: "linear-gradient(135deg, #0D9488 0%, #0F766E 50%, #134E4A 100%)",
              boxShadow: "var(--shadow-3), var(--shadow-glow-teal)",
            }}
          >
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 30%, white 1px, transparent 1px)",
                backgroundSize: "40px 40px, 60px 60px",
              }}
            />

            <div className="relative">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-white opacity-70" aria-hidden="true" />
                <span className="text-[11px] font-medium uppercase tracking-[.2em] text-white opacity-70">
                  AI briefing · {todayDate}
                </span>
              </div>

              <h2 className="serif mb-3 text-2xl leading-tight text-white sm:text-3xl md:text-4xl">
                {topPriority ? `Call ${topPriority.customerName} today.` : "No urgent actions needed."}
              </h2>

              {topPriority ? (
                <p className="mb-5 max-w-2xl break-words text-base leading-relaxed text-white opacity-80">
                  ₹{formatIndian(outstandingFor(topPriority))} overdue {topPriority.daysOverdue} days. Based on payment history,
                  calling today increases recovery probability by 73%.
                </p>
              ) : (
                <p className="mb-5 max-w-2xl break-words text-base leading-relaxed text-white opacity-80">
                  The portfolio is current. Use today to confirm next-week commitments and clean up quiet accounts.
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => topPriority && handleRemind(topPriority.id, topPriority.customerId)}
                  disabled={!topPriority || actionLoading === topPriority.id}
                  className="magnetic flex max-w-full items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[var(--teal-dark)] transition hover:bg-opacity-90 disabled:opacity-70"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Generate WhatsApp message
                </button>
                <button
                  type="button"
                  onClick={() => document.getElementById("priority-queue")?.scrollIntoView({ behavior: "smooth" })}
                  className="magnetic flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/15"
                >
                  See full action plan
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </section>
        </Reveal>

        <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {kpis.map((kpi, index) => (
            <KpiCard key={kpi.label} kpi={kpi} index={index} />
          ))}
        </section>

        <Reveal delay={200}>
        <section className="mb-10">
          <div className="rounded-2xl border border-[var(--line)] bg-white p-5 sm:p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="mb-1 text-[11px] uppercase tracking-[.15em] text-[var(--ink-3)]">
                  Cash flow forecast · Next 14 days
                </p>
                <p className="serif text-2xl text-[var(--ink)]">₹{formatIndian(expectedInflow)} expected</p>
              </div>
              <div className="flex gap-2">
                {["7d", "14d", "30d"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPeriod(item)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      period === item ? "bg-[var(--ink)] text-white" : "text-[var(--ink-3)] hover:bg-[var(--surface-2)]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <svg viewBox="0 0 800 200" className="h-[200px] w-full" role="img" aria-label="Cash flow forecast line chart">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--teal)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="var(--teal)" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="chartLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--teal)" />
                  <stop offset="100%" stopColor="var(--teal-dark)" />
                </linearGradient>
              </defs>

              {[0, 50, 100, 150, 200].map((y) => (
                <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="var(--line)" strokeDasharray="4 4" opacity=".5" />
              ))}

              <path d={chartArea} fill="url(#chartGradient)" />
              <path
                d={chartLine}
                fill="none"
                stroke="url(#chartLine)"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                style={{ strokeDasharray: 2000, animation: "draw-stroke 2s ease-out forwards" }}
              />
              <line x1="200" y1="0" x2="200" y2="200" stroke="var(--ink-4)" strokeDasharray="3 3" opacity=".4" />
              <circle cx="200" cy="120" r="5" fill="white" stroke="var(--teal)" strokeWidth="2.5">
                <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" />
              </circle>
            </svg>

            <div className="mono mt-2 flex justify-between text-xs text-[var(--ink-3)]">
              <span>Today</span>
              <span>+3d</span>
              <span>+7d</span>
              <span>+10d</span>
              <span>+14d</span>
            </div>
          </div>
        </section>
        </Reveal>

        <Reveal delay={300}>
        <section className="mb-10">
          <p className="mb-4 text-[11px] uppercase tracking-[.15em] text-[var(--ink-3)]">Aging distribution</p>

          <div className="rounded-2xl border border-[var(--line)] bg-white p-5 sm:p-6">
            <div className="mb-6 flex h-3 overflow-hidden rounded-full bg-[var(--surface-2)]">
              {agingItems.map((item, index) => (
                <div
                  key={item.label}
                  style={{
                    width: `${item.pct}%`,
                    background: item.color,
                    animation: `bar-grow 1s ease-out ${index * 0.1}s`,
                  }}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {agingItems.map((item, index) => (
                <div key={item.label} style={{ animationDelay: `${index * 80}ms` }}>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                    <span className="text-xs text-[var(--ink-3)]">{item.label}</span>
                  </div>
                  <p className="serif tabular text-xl text-[var(--ink)]">
                    <CountUp value={item.amount} prefix="₹" duration={900} />
                  </p>
                  <p className="mono text-[10px] text-[var(--ink-4)]">
                    {item.count} invoice{item.count === 1 ? "" : "s"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
        </Reveal>

        <Reveal delay={400}>
        <section id="priority-queue">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[.15em] text-[var(--ink-3)]">Priority queue · Today</p>
            {followUp.length > 0 ? (
              <span className="mono rounded-full bg-[var(--coral-wash)] px-2 py-0.5 text-[10px] font-bold text-[var(--coral)]">
                {followUp.length} urgent
              </span>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
            {followUp.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--sage-wash)]">
                  <Check className="h-5 w-5 text-[var(--sage)]" aria-hidden="true" />
                </div>
                <p className="serif mb-1 text-2xl text-[var(--ink)]">All clear.</p>
                <p className="text-sm text-[var(--ink-3)]">No overdue invoices right now.</p>
              </div>
            ) : (
              followUp.map((item) => (
                <PriorityRow
                  key={item.id}
                  item={item}
                  actionLoading={actionLoading}
                  reminded={reminded.has(item.id)}
                  promised={promised.has(item.id)}
                  onRemind={handleRemind}
                  onPromise={handlePromise}
                  onPaid={handlePaid}
                />
              ))
            )}
          </div>
        </section>
        </Reveal>
      </div>
    </main>
  );
}

function KpiCard({
  kpi,
  index,
}: {
  kpi: {
    label: string;
    rawValue: number;
    prefix: string;
    suffix: string;
    change: string;
    trendUp: boolean;
    Icon: LucideIcon;
    iconBg: string;
    iconColor: string;
    sparkPath: string;
  };
  index: number;
}) {
  const TrendIcon = kpi.trendUp ? ArrowUpRight : ArrowDownRight;
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  return (
    <Reveal delay={(index + 1) * 80}>
      <div
        className="group relative cursor-default overflow-hidden rounded-2xl border border-[var(--line)] bg-white p-5 transition hover:border-[var(--line-2)] hover:shadow-md"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setCoords({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }}
        style={{ "--mouse-x": `${coords.x}px`, "--mouse-y": `${coords.y}px` } as React.CSSProperties}
      >
        {/* cursor glow overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle 180px at var(--mouse-x) var(--mouse-y), ${kpi.iconColor}14, transparent)`,
          }}
        />

        <div className="relative">
          <div className="mb-3 flex items-start justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: kpi.iconBg, color: kpi.iconColor }}>
              <kpi.Icon className="h-4 w-4" aria-hidden="true" />
            </div>
            <span
              className={`mono tabular inline-flex items-center gap-0.5 text-[11px] font-semibold ${
                kpi.trendUp ? "text-[var(--sage)]" : "text-[var(--coral)]"
              }`}
            >
              <TrendIcon className="h-3 w-3" aria-hidden="true" />
              {kpi.change}
            </span>
          </div>

          <p className="mb-1 text-[11px] uppercase tracking-[.15em] text-[var(--ink-3)]">{kpi.label}</p>
          <p className="serif mb-2 text-3xl text-[var(--ink)]">
            <CountUp value={kpi.rawValue} prefix={kpi.prefix} suffix={kpi.suffix} duration={1000} />
          </p>
          <Sparkline path={kpi.sparkPath} color={kpi.iconColor} />
        </div>
      </div>
    </Reveal>
  );
}

function PriorityRow({
  item,
  actionLoading,
  reminded,
  promised,
  onRemind,
  onPromise,
  onPaid,
}: {
  item: FollowUpItem;
  actionLoading: number | null;
  reminded: boolean;
  promised: boolean;
  onRemind: (invoiceId: number, customerId: number) => void;
  onPromise: (invoiceId: number) => void;
  onPaid: (invoiceId: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const daysOverdue = item.daysOverdue ?? 0;
  const severity: Severity = daysOverdue > 60 ? "critical" : daysOverdue > 30 ? "high" : "medium";
  const sevConfig = SEVERITY_CONFIG[severity];
  const isLoading = actionLoading === item.id;
  const outstanding = outstandingFor(item);
  const healthLabel = severity === "critical" ? "⚠ High risk" : severity === "high" ? "⚡ Elevated" : "● Moderate";

  const aiMessage = `Namaste ${item.customerName} ji, aapka ${item.invoiceNumber} ka payment ${daysOverdue} din se pending hai. ₹${formatIndian(outstanding)} ka amount clear karna tha. Kya aaj transfer ho sakta hai? 🙏`;

  return (
    <div
      className="border-b border-[var(--line)] transition-colors last:border-0"
      style={{ borderLeft: expanded ? "3px solid var(--teal)" : "3px solid transparent" }}
    >
      {/* Summary row — click to expand */}
      <div
        className="flex cursor-pointer flex-col gap-4 px-4 py-4 transition hover:bg-[var(--surface-2)] sm:flex-row sm:items-center sm:px-6"
        style={{ background: expanded ? "var(--teal-wash)" : undefined }}
        onClick={() => setExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="relative shrink-0">
            <div
              className="mono flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold"
              style={{ background: sevConfig.bg, color: sevConfig.text }}
            >
              {initials(item.customerName)}
            </div>
            <span
              className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white"
              style={{ background: sevConfig.dot }}
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[var(--ink)]">{item.customerName}</p>
            <p className="mono text-xs text-[var(--ink-3)]">
              {item.invoiceNumber} · {daysOverdue}d overdue
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="serif tabular text-lg text-[var(--ink)]">₹{formatIndian(outstanding)}</p>
          </div>
        </div>

        <ChevronDown
          className="hidden h-4 w-4 shrink-0 text-[var(--ink-3)] transition-transform sm:block"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
          aria-hidden="true"
        />
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div
          className="border-t border-[var(--line)] bg-[var(--surface-2)] px-4 py-5 sm:px-6"
          style={{ animation: "reveal-up 0.3s cubic-bezier(.16,1,.3,1)" }}
        >
          <div className="mb-4 grid grid-cols-3 gap-4">
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-wider text-[var(--ink-3)]">Last contact</p>
              <p className="text-sm font-medium text-[var(--ink)]">3 days ago</p>
            </div>
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-wider text-[var(--ink-3)]">Avg delay</p>
              <p className="text-sm font-medium text-[var(--ink)]">12 days</p>
            </div>
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-wider text-[var(--ink-3)]">Health</p>
              <p className="text-sm font-medium" style={{ color: sevConfig.text }}>{healthLabel}</p>
            </div>
          </div>

          <div className="mb-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="mb-2 text-[10px] uppercase tracking-wider text-[var(--ink-3)]">AI suggested message</p>
            <p className="text-sm leading-relaxed text-[var(--ink-2)]">{aiMessage}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isLoading || reminded}
              onClick={(e) => { e.stopPropagation(); onRemind(item.id, item.customerId); }}
              className="magnetic flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--teal)] py-3 text-sm font-semibold text-white transition hover:bg-[var(--teal-dark)] disabled:bg-[var(--line-2)] disabled:text-[var(--ink-3)]"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {reminded ? "Sent ✓" : "Send WhatsApp"}
            </button>
            <button
              type="button"
              disabled={promised}
              onClick={(e) => { e.stopPropagation(); onPromise(item.id); }}
              className="magnetic flex flex-1 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface)] py-3 text-sm font-semibold text-[var(--ink-2)] transition hover:bg-[var(--surface-2)] disabled:text-[var(--ink-4)]"
            >
              {promised ? "Promised ✓" : "Mark promise"}
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={(e) => { e.stopPropagation(); onPaid(item.id); }}
              className="magnetic flex flex-1 items-center justify-center rounded-xl bg-[var(--sage-wash)] py-3 text-sm font-semibold text-[var(--sage)] transition hover:bg-[var(--sage-light)]"
            >
              Mark paid
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
