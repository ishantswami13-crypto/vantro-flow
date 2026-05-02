"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { ArrowRight, Building2, Clock3, FileText, Phone, Search, ShieldCheck, SlidersHorizontal, Target, Users, X } from "lucide-react";
import CountUp from "@/components/CountUp";
import Reveal from "@/components/Reveal";
import { Skeleton } from "@/components/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import RiskBadge, { getRiskLevel } from "@/components/ui/RiskBadge";
import { formatCompact } from "@/lib/format";

type CustomerRecord = {
  id: number;
  name: string;
  phone: string | null;
  city: string | null;
  invoiceCount: number;
  outstanding: number;
  maxDaysOverdue: number;
};

type RiskFilter = "all" | "safe" | "watchlist" | "high" | "overdue";

const riskFilters: Array<{ id: RiskFilter; label: string }> = [
  { id: "all",       label: "All" },
  { id: "safe",      label: "Safe" },
  { id: "watchlist", label: "Watchlist" },
  { id: "high",      label: "High risk" },
  { id: "overdue",   label: "Overdue" },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function nextBestAction(customer: CustomerRecord) {
  const riskLevel = getRiskLevel(customer.maxDaysOverdue, customer.outstanding);
  if (riskLevel === "critical" || riskLevel === "overdue") return "Call decision-maker";
  if (riskLevel === "high") return "Confirm promise";
  if (riskLevel === "watchlist") return "Send reminder";
  return "Monitor relationship";
}

function riskMovement(customer: CustomerRecord) {
  if (customer.maxDaysOverdue >= 60) return { label: "Critical", color: "var(--danger)", soft: "var(--danger-soft)" };
  if (customer.maxDaysOverdue >= 21) return { label: "Increased", color: "var(--warning)", soft: "var(--warning-soft)" };
  if (customer.outstanding > 0) return { label: "Stable watch", color: "var(--brand-primary)", soft: "var(--brand-primary-soft)" };
  return { label: "Healthy", color: "var(--success)", soft: "var(--success-soft)" };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [selected, setSelected] = useState<CustomerRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);
  const q = deferredQuery.trim().toLowerCase();

  useEffect(() => {
    const ctrl = new AbortController();
    async function load() {
      setLoading(true); setError(null);
      try {
        const res = await fetch("/api/customers", { cache: "no-store", signal: ctrl.signal });
        if (!res.ok) throw new Error("Failed to load customers");
        const data = (await res.json()) as CustomerRecord[];
        startTransition(() => setCustomers(data));
      } catch (err) {
        if (!ctrl.signal.aborted) setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => ctrl.abort();
  }, []);

  const searched = q
    ? customers.filter((c) => c.name.toLowerCase().includes(q) || (c.phone ?? "").includes(deferredQuery.trim()))
    : customers;
  const filtered = riskFilter === "all"
    ? searched
    : searched.filter((c) => {
        const lvl = getRiskLevel(c.maxDaysOverdue, c.outstanding);
        if (riskFilter === "overdue") return lvl === "overdue" || lvl === "critical";
        return lvl === riskFilter;
      });

  const totalOutstanding = filtered.reduce((s, c) => s + c.outstanding, 0);
  const totalInvoices = filtered.reduce((s, c) => s + c.invoiceCount, 0);
  const maxOut = Math.max(...filtered.map((c) => c.outstanding), 1);
  const portfolioOutstanding = customers.reduce((s, c) => s + c.outstanding, 0);
  const largestExposure = customers.reduce((max, c) => Math.max(max, c.outstanding), 0);
  const concentrationPct = portfolioOutstanding ? Math.round((largestExposure / portfolioOutstanding) * 100) : 0;
  const highRiskCount = customers.filter((c) => {
    const lvl = getRiskLevel(c.maxDaysOverdue, c.outstanding);
    return lvl === "high" || lvl === "overdue" || lvl === "critical";
  }).length;

  return (
    <main style={{ background: "var(--background)", minHeight: "100vh" }}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">

        {/* Header */}
        <Reveal>
          <div className="vf-command-surface mb-6 rounded-[28px] p-6 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="apple-eyebrow mb-2">Accounts intelligence</p>
                <h1 className="text-4xl font-semibold tracking-[-0.02em] text-[var(--text-primary)] sm:text-5xl">
                  Account exposure map.
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--text-tertiary)]">
                  Every account ranked by exposure, payment behavior, risk movement, and next best action.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Accounts",    value: <CountUp value={filtered.length} /> },
                  { label: "Invoices",    value: <CountUp value={totalInvoices} /> },
                  { label: "Outstanding", value: <CountUp value={totalOutstanding} prefix="₹" /> },
                  { label: "High risk",   value: <CountUp value={highRiskCount} /> },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl p-3" style={{ background: "var(--surface-0)", border: "1px solid var(--border-subtle)" }}>
                    <p className="apple-eyebrow mb-1">{item.label}</p>
                    <div className="serif tabular text-lg text-[var(--text-primary)]">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={70}>
          <div className="mb-5 grid gap-3 md:grid-cols-3">
            {[
              { icon: Target, label: "Largest exposure", value: `${concentrationPct}%`, body: "Share held by the largest unpaid account", color: "var(--brand-primary)", soft: "var(--brand-primary-soft)" },
              { icon: Clock3, label: "Delay pressure", value: `${highRiskCount}`, body: "Accounts requiring stronger collection rhythm", color: "var(--warning)", soft: "var(--warning-soft)" },
              { icon: ShieldCheck, label: "Relationship control", value: filtered.length ? "Active" : "Waiting", body: "Open any account to inspect action context", color: "var(--success)", soft: "var(--success-soft)" },
            ].map((signal) => {
              const Icon = signal.icon;
              return (
                <div key={signal.label} className="vf-data-card vf-hover-depth rounded-2xl p-4">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: signal.soft, color: signal.color }}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <p className="apple-eyebrow mb-1">{signal.label}</p>
                  <p className="serif tabular text-2xl text-[var(--text-primary)]">{signal.value}</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--text-tertiary)]">{signal.body}</p>
                </div>
              );
            })}
          </div>
        </Reveal>

        {/* Filters */}
        <Reveal delay={100}>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--text-muted)]" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Risk</span>
              {riskFilters.map((f) => (
                <button key={f.id} type="button" onClick={() => setRiskFilter(f.id)}
                  className="magnetic rounded-full px-3 py-1 text-xs font-semibold transition"
                  style={riskFilter === f.id
                    ? { background: "var(--brand-primary)", color: "white" }
                    : { background: "var(--surface-2)", color: "var(--text-tertiary)", border: "1px solid var(--border-subtle)" }}>
                  {f.label}
                </button>
              ))}
            </div>
            <label className="relative">
              <span className="sr-only">Search accounts</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" aria-hidden="true" />
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search account or city..."
                className="h-9 w-full rounded-full pl-9 pr-4 text-sm outline-none transition"
                style={{ background: "var(--surface-0)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                onFocus={(e) => { e.target.style.borderColor = "var(--brand-primary)"; e.target.style.boxShadow = "0 0 0 3px var(--brand-primary-soft)"; }}
                onBlur={(e) => { e.target.style.borderColor = "var(--border-default)"; e.target.style.boxShadow = "none"; }}
              />
              {query && (
                <button type="button" onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]" aria-label="Clear">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </label>
          </div>
        </Reveal>

        {/* Table */}
        <Reveal delay={160}>
          <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-xs)" }}>
            {/* Header row (desktop) */}
            <div className="hidden grid-cols-[1fr_140px_100px_120px_140px] gap-4 border-b px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] lg:grid"
              style={{ borderColor: "var(--border-subtle)", background: "var(--surface-1)", color: "var(--text-muted)" }}>
              <div>Account</div><div>Outstanding</div><div className="text-right">Invoices</div><div>Risk</div><div>Next action</div>
            </div>

            <div style={{ background: "var(--surface-0)" }}>
              {loading ? (
                <div className="space-y-3 p-4">
                  {[0, 1, 2, 3].map((i) => <Skeleton key={i} height="5.5rem" className="rounded-xl" />)}
                </div>
              ) : error ? (
                <div className="p-6"><ErrorState title="Accounts could not load" description={error} /></div>
              ) : customers.length === 0 ? (
                <div className="p-6">
                  <EmptyState icon={Users} title="No accounts yet."
                    description="Upload invoices or add receivables manually."
                    action={<Link href="/upload" className="magnetic apple-button apple-button-primary px-5 py-2.5 text-sm font-semibold">Upload invoices</Link>} />
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-6">
                  <EmptyState icon={Search} title="No accounts match this view."
                    description="Try a shorter search or switch the risk filter to All." />
                </div>
              ) : (
                filtered.map((customer, index) => {
                  const width = Math.max((customer.outstanding / maxOut) * 100, customer.outstanding > 0 ? 6 : 0);
                  const riskLevel = getRiskLevel(customer.maxDaysOverdue, customer.outstanding);
                  const nextAction = nextBestAction(customer);
                  const movement = riskMovement(customer);

                  return (
                    <button key={customer.id} type="button" onClick={() => setSelected(customer)}
                      className={`vf-risk-edge block w-full px-5 py-4 pl-6 text-left transition-colors hover:bg-[var(--surface-1)] ${index > 0 ? "border-t" : ""}`}
                      style={{ borderColor: "var(--border-subtle)", "--edge-color": movement.color, "--edge-opacity": customer.outstanding > 0 ? 0.82 : 0.35 } as CSSProperties}>
                      <div className="grid gap-4 lg:grid-cols-[1fr_140px_100px_120px_140px] lg:items-center">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                              style={{ background: "var(--brand-primary-soft)", color: "var(--brand-primary)" }}>
                              {initials(customer.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{customer.name}</p>
                              <p className="truncate text-xs uppercase tracking-wide text-[var(--text-muted)]">
                                {customer.city || "City not tagged"}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2.5 h-1 rounded-full" style={{ background: "var(--surface-2)" }}>
                            <div className="h-full rounded-full" style={{ width: `${width}%`, background: "var(--brand-primary)" }} />
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] lg:hidden">Outstanding</p>
                          <p className="serif tabular mt-0.5 text-sm text-[var(--text-primary)]">
                            {formatCompact(customer.outstanding)}
                          </p>
                        </div>
                        <div className="text-left lg:text-right">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] lg:hidden">Invoices</p>
                          <p className="mt-0.5 text-sm font-semibold text-[var(--text-primary)]">{customer.invoiceCount}</p>
                        </div>
                        <div><RiskBadge level={riskLevel} label={customer.maxDaysOverdue > 0 ? `${customer.maxDaysOverdue}d` : undefined} /></div>
                        <div className="flex items-center justify-between gap-2 text-sm font-semibold lg:justify-start"
                          style={{ color: "var(--brand-primary)" }}>
                          {nextAction}
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </Reveal>
      </div>

      {selected && <CustomerDrawer customer={selected} onClose={() => setSelected(null)} />}
    </main>
  );
}

function CustomerDrawer({ customer, onClose }: { customer: CustomerRecord; onClose: () => void }) {
  const riskLevel = getRiskLevel(customer.maxDaysOverdue, customer.outstanding);
  const movement = riskMovement(customer);
  const action = nextBestAction(customer);
  const suggestion =
    riskLevel === "critical" || riskLevel === "overdue"
      ? "Call the owner today and ask for a committed transfer date."
      : riskLevel === "high"
      ? "Confirm a payment promise and schedule the next reminder."
      : riskLevel === "watchlist"
      ? "Send a concise payment reminder before this becomes overdue."
      : "No intervention needed. Keep on weekly review.";

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <aside className="h-full w-full max-w-md overflow-y-auto"
        style={{ background: "var(--surface-0)", borderLeft: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-lg)", animation: "drawer-in 0.24s ease" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b px-5 py-4"
          style={{ background: "var(--surface-0)", borderColor: "var(--border-subtle)" }}>
          <div>
            <p className="apple-eyebrow">Account card</p>
            <h3 className="serif mt-0.5 text-xl text-[var(--text-primary)]">{customer.name}</h3>
          </div>
          <button type="button" onClick={onClose}
            className="magnetic flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            style={{ background: "var(--surface-2)" }} aria-label="Close">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="vf-command-surface rounded-2xl p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-[var(--text-tertiary)]">{customer.city || "No location"} &middot; {customer.phone || "No phone"}</p>
                <p className="serif tabular mt-2 text-3xl text-[var(--text-primary)]">
                  <CountUp value={customer.outstanding} prefix="₹" />
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">Outstanding balance</p>
              </div>
              <RiskBadge level={riskLevel} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {([["Open invoices", customer.invoiceCount, ""], ["Oldest due", customer.maxDaysOverdue, "d"], ["Avg delay", Math.max(customer.maxDaysOverdue - 6, 0), "d"]] as [string, number, string][]).map(([label, value, suffix]) => (
                <div key={label} className="rounded-xl p-3" style={{ background: "var(--surface-0)" }}>
                  <p className="mono text-lg font-semibold text-[var(--text-primary)]">
                    <CountUp value={value} />{suffix}
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-4" style={{ background: movement.soft, border: "1px solid var(--border-subtle)" }}>
              <p className="apple-eyebrow mb-1">Risk movement</p>
              <p className="text-base font-semibold" style={{ color: movement.color }}>{movement.label}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--text-tertiary)]">Based on overdue age and unpaid exposure.</p>
            </div>
            <div className="rounded-2xl p-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)" }}>
              <p className="apple-eyebrow mb-1">Impact</p>
              <p className="serif tabular text-xl text-[var(--text-primary)]">{formatCompact(customer.outstanding)}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--text-tertiary)]">Potential cash unlocked by resolution.</p>
            </div>
          </div>

          <div className="rounded-2xl p-5" style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)" }}>
            <p className="apple-eyebrow mb-2">Suggested action</p>
            <p className="text-sm leading-6 text-[var(--text-secondary)]">{suggestion}</p>
            <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] p-4">
              <p className="apple-eyebrow mb-3">Relationship timeline</p>
              <div className="space-y-3">
                {[
                  { icon: Building2, title: "Account opened", body: customer.city || "Location not tagged" },
                  { icon: FileText, title: `${customer.invoiceCount} open invoice${customer.invoiceCount === 1 ? "" : "s"}`, body: `${customer.maxDaysOverdue} days oldest due` },
                  { icon: Target, title: action, body: "Next best action from current risk state" },
                ].map((event) => {
                  const Icon = event.icon;
                  return (
                    <div key={event.title} className="flex gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{event.title}</p>
                        <p className="text-xs leading-5 text-[var(--text-tertiary)]">{event.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {customer.phone && (
                <a href={`tel:${customer.phone}`} className="magnetic apple-button apple-button-secondary inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold">
                  <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                  Call account
                </a>
              )}
              <Link href={`/customers/${customer.id}`}
                className="magnetic apple-button apple-button-primary px-4 py-2 text-sm font-semibold">
                Open full ledger
              </Link>
              <Link href="/upload"
                className="magnetic apple-button apple-button-secondary px-4 py-2 text-sm font-semibold">
                Add invoice
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
