"use client";

import { startTransition, useEffect, useState } from "react";
import {
  ArrowDownLeft, ArrowUpRight, BarChart3, Calendar,
  CreditCard, TrendingDown, TrendingUp,
} from "lucide-react";
import CountUp from "@/components/CountUp";
import Reveal from "@/components/Reveal";
import { Skeleton } from "@/components/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { formatCompact } from "@/lib/format";

type Transaction = {
  id: number; type: "inflow" | "outflow"; amount: number;
  paymentDate: string; paymentMode: string | null;
  referenceNumber: string | null; customerName: string | null;
  vendorName: string | null; notes: string | null;
};
type DailySeries = { date: string; inflow: number; outflow: number; net: number };
type CashFlowPayload = {
  totalInflow: number; totalOutflow: number; netFlow: number;
  monthInflow: number; monthOutflow: number; monthNet: number;
  forecast: { expectedInflows: number; expectedOutflows: number; netForecast: number };
  dailySeries: DailySeries[]; recentTransactions: Transaction[];
};
type Period = 7 | 30 | 90;

const MODE_LABELS: Record<string, string> = { upi: "UPI", neft: "NEFT", cash: "Cash", cheque: "Cheque", card: "Card" };

function FlowChart({ series }: { series: DailySeries[] }) {
  if (!series.length) return null;
  const W = 800, H = 200, pad = { t: 20, r: 16, b: 36, l: 16 };
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
  const maxVal = Math.max(...series.map(d => Math.max(d.inflow, d.outflow)), 1);
  const bw = Math.max(iW / series.length - 2, 2);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
      <defs>
        <linearGradient id="ig" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--success)" stopOpacity="0.9" /><stop offset="100%" stopColor="var(--success)" stopOpacity="0.5" /></linearGradient>
        <linearGradient id="og" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--danger)" stopOpacity="0.9" /><stop offset="100%" stopColor="var(--danger)" stopOpacity="0.5" /></linearGradient>
      </defs>
      {[0.25,0.5,0.75,1].map(f => <line key={f} x1={pad.l} y1={pad.t+iH-f*iH} x2={W-pad.r} y2={pad.t+iH-f*iH} stroke="var(--border-subtle)" strokeDasharray="4 4" strokeWidth="1" />)}
      {series.map((d, i) => {
        const x = pad.l + (i / Math.max(series.length - 1, 1)) * iW;
        const ih = (d.inflow / maxVal) * iH, oh = (d.outflow / maxVal) * iH;
        return <g key={d.date}>
          <rect x={x-bw-1} y={pad.t+iH-ih} width={bw} height={ih} rx={2} fill="url(#ig)" />
          <rect x={x+1} y={pad.t+iH-oh} width={bw} height={oh} rx={2} fill="url(#og)" />
        </g>;
      })}
      {series.filter((_,i) => i===0||i===Math.floor(series.length/2)||i===series.length-1).map(d => {
        const idx = series.indexOf(d);
        const x = pad.l + (idx / Math.max(series.length-1,1)) * iW;
        return <text key={d.date} x={x} y={H-6} textAnchor="middle" fontSize="10" fill="var(--text-muted)" fontFamily="JetBrains Mono, monospace">{new Date(d.date).toLocaleDateString("en-IN",{month:"short",day:"numeric"})}</text>;
      })}
    </svg>
  );
}

export default function CashFlowPage() {
  const [data, setData] = useState<CashFlowPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>(30);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      setLoading(true); setError(null);
      try {
        const res = await fetch(`/api/cashflow?days=${period}`, { cache: "no-store", signal: ctrl.signal });
        if (!res.ok) throw new Error("Failed to load");
        const payload = (await res.json()) as CashFlowPayload;
        startTransition(() => setData(payload));
      } catch (err) { if (!ctrl.signal.aborted) setError(err instanceof Error ? err.message : "Failed"); }
      finally { if (!ctrl.signal.aborted) setLoading(false); }
    })();
    return () => ctrl.abort();
  }, [period]);

  const kpis = [
    { label: "Total Inflow", value: data?.totalInflow ?? 0, icon: ArrowDownLeft, color: "var(--success)", colorSoft: "var(--success-soft)", sub: `Last ${period}d` },
    { label: "Total Outflow", value: data?.totalOutflow ?? 0, icon: ArrowUpRight, color: "var(--danger)", colorSoft: "var(--danger-soft)", sub: `Last ${period}d` },
    { label: "Net Cash Flow", value: data?.netFlow ?? 0, icon: (data?.netFlow??0)>=0?TrendingUp:TrendingDown, color: (data?.netFlow??0)>=0?"var(--success)":"var(--danger)", colorSoft: (data?.netFlow??0)>=0?"var(--success-soft)":"var(--danger-soft)", sub: (data?.netFlow??0)>=0?"Positive":"Negative" },
    { label: "Forecast (7d)", value: data?.forecast.netForecast ?? 0, icon: Calendar, color: "var(--brand-primary)", colorSoft: "var(--brand-primary-soft)", sub: `In: ${formatCompact(data?.forecast.expectedInflows??0)} · Out: ${formatCompact(data?.forecast.expectedOutflows??0)}` },
  ];

  return (
    <main style={{ background: "var(--background)", minHeight: "100vh" }}>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <Reveal>
          <div className="rounded-2xl p-6 sm:p-8" style={{ background: "linear-gradient(135deg, var(--brand-primary-soft) 0%, var(--surface-0) 60%)", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-sm)" }}>
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="apple-eyebrow mb-2">Cash Flow Intelligence</p>
                <h1 className="serif text-4xl text-[var(--text-primary)] sm:text-5xl">Money in motion.</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--text-tertiary)]">Real-time view of every rupee flowing in and out of your business.</p>
              </div>
              <div className="flex items-center gap-2">
                {([7,30,90] as Period[]).map(p => (
                  <button key={p} type="button" onClick={() => setPeriod(p)} className="magnetic rounded-full px-4 py-2 text-xs font-semibold transition"
                    style={period===p?{background:"var(--brand-primary)",color:"white"}:{background:"var(--surface-2)",color:"var(--text-tertiary)",border:"1px solid var(--border-subtle)"}}>{p}d</button>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        {error && <ErrorState title="Cash flow data unavailable" description={error} />}

        <Reveal delay={100}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map(kpi => { const Icon = kpi.icon; return (
              <div key={kpi.label} className="rounded-2xl p-5 transition-shadow hover:shadow-[var(--shadow-sm)]" style={{ background: "var(--surface-0)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-xs)" }}>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: kpi.colorSoft, color: kpi.color }}><Icon className="h-4 w-4" /></div>
                <p className="apple-eyebrow mb-1">{kpi.label}</p>
                <div className="serif tabular text-2xl text-[var(--text-primary)]">{loading ? <Skeleton width="80px" height="2rem" /> : <CountUp value={kpi.value} prefix="₹" />}</div>
                <p className="mt-2 text-xs text-[var(--text-tertiary)]">{kpi.sub}</p>
              </div>
            ); })}
          </div>
        </Reveal>

        <Reveal delay={160}>
          <div className="rounded-2xl p-5 sm:p-6" style={{ background: "var(--surface-0)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-xs)" }}>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div><p className="apple-eyebrow mb-1">Inflow vs Outflow</p><p className="serif text-xl text-[var(--text-primary)]">Daily cash movement</p></div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]"><span className="h-2 w-2 rounded-full" style={{ background: "var(--success)" }} />Inflow</span>
                <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]"><span className="h-2 w-2 rounded-full" style={{ background: "var(--danger)" }} />Outflow</span>
              </div>
            </div>
            {loading ? <Skeleton height="200px" className="rounded-xl" /> : data?.dailySeries.length ? <FlowChart series={data.dailySeries} /> : <EmptyState icon={BarChart3} title="No transactions yet." description="Record payments to see your cash flow chart." />}
          </div>
        </Reveal>

        <Reveal delay={220}>
          <div className="overflow-hidden rounded-2xl" style={{ background: "var(--surface-0)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-xs)" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <div><p className="apple-eyebrow mb-0.5">Transactions</p><p className="serif text-xl text-[var(--text-primary)]">Recent activity</p></div>
              <CreditCard className="h-5 w-5 text-[var(--text-muted)]" />
            </div>
            {loading ? <div className="space-y-3 p-4">{[0,1,2].map(i => <Skeleton key={i} height="4rem" className="rounded-xl" />)}</div>
            : !data?.recentTransactions.length ? <div className="px-5 py-12 text-center"><EmptyState icon={CreditCard} title="No transactions yet." description="Record a payment to see it here." /></div>
            : data.recentTransactions.map((tx, i) => (
              <div key={tx.id} className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--surface-1)] ${i>0?"border-t":""}`} style={{ borderColor: "var(--border-subtle)" }}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: tx.type==="inflow"?"var(--success-soft)":"var(--danger-soft)", color: tx.type==="inflow"?"var(--success)":"var(--danger)" }}>
                  {tx.type==="inflow"?<ArrowDownLeft className="h-4 w-4" />:<ArrowUpRight className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{tx.type==="inflow"?tx.customerName||"Customer payment":tx.vendorName||"Expense payment"}</p>
                  <p className="mono truncate text-xs text-[var(--text-muted)]">{new Date(tx.paymentDate).toLocaleDateString("en-IN",{month:"short",day:"numeric"})}{tx.paymentMode?` · ${MODE_LABELS[tx.paymentMode]||tx.paymentMode}`:""}</p>
                </div>
                <p className="serif tabular shrink-0 text-base font-semibold" style={{ color: tx.type==="inflow"?"var(--success)":"var(--danger)" }}>{tx.type==="inflow"?"+":"−"}{formatCompact(tx.amount)}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </main>
  );
}
