"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CollectionsGlobe from "@/components/dashboard/CollectionsGlobe";
import type { DashboardPayload } from "@/components/dashboard/types";

/* ── helpers ──────────────────────────────────────── */

function fmt(n: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n || 0);
}

function getTimeOfDay(): string {
  const h = new Date().getHours();
  return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
}

/* ── inline add-invoice form (no framer-motion) ──── */

interface AddFormState {
  customer_name: string;
  phone: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  amount: string;
}

function AddInvoiceModal({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState<AddFormState>({
    customer_name: "",
    phone: "",
    invoice_number: "",
    invoice_date: today,
    due_date: "",
    amount: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function setField<K extends keyof AddFormState>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setErr(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customer_name.trim() || !form.phone.trim() || !form.invoice_number.trim() || !form.amount.trim()) {
      setErr("Customer name, phone, invoice number, and amount are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: [form] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add invoice");
      onSuccess();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const fields: { label: string; key: keyof AddFormState; type: string; placeholder: string; full?: boolean }[] = [
    { label: "Customer Name *", key: "customer_name", type: "text", placeholder: "Ramesh Traders", full: true },
    { label: "Phone *", key: "phone", type: "text", placeholder: "9876543210", full: true },
    { label: "Invoice Number *", key: "invoice_number", type: "text", placeholder: "INV-001", full: true },
    { label: "Invoice Date", key: "invoice_date", type: "date", placeholder: "" },
    { label: "Due Date", key: "due_date", type: "date", placeholder: "" },
    { label: "Amount (₹) *", key: "amount", type: "number", placeholder: "25000", full: true },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl p-6"
        style={{ background: "var(--white)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2
              className="text-2xl font-normal"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: "var(--ink)" }}
            >
              Add Invoice
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
              Capture a new receivable manually.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors"
            style={{ background: "var(--cream)", color: "var(--ink-muted)", border: "1px solid var(--border)" }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {fields.map(({ label, key, type, placeholder, full }) => (
              <label key={key} className={full ? "col-span-2" : ""}>
                <span className="block text-xs font-medium mb-1" style={{ color: "var(--ink-light)" }}>
                  {label}
                </span>
                <input
                  type={type}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) => setField(key, e.target.value)}
                  className="apple-input px-3 py-2.5 text-sm"
                />
              </label>
            ))}
          </div>

          {err && (
            <p className="text-xs rounded-xl px-3 py-2" style={{ background: "var(--coral-wash)", color: "var(--coral)" }}>
              {err}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="apple-button apple-button-primary flex-1 py-2.5 text-sm font-semibold"
            >
              {saving ? "Saving…" : "Add Invoice"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="apple-button apple-button-secondary px-4 py-2.5 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── empty state ─────────────────────────────────── */

function EmptyState({
  onDemoLoaded,
  onAddManually,
}: {
  onDemoLoaded: () => void;
  onAddManually: () => void;
}) {
  const [seeding, setSeeding] = useState(false);

  async function handleSeed() {
    setSeeding(true);
    try {
      await fetch("/api/seed-demo", { method: "POST" });
      onDemoLoaded();
    } finally {
      setSeeding(false);
    }
  }

  return (
    <main style={{ background: "var(--off-white)" }}>
      <div className="mx-auto flex max-w-6xl flex-col items-center px-6 py-20 text-center">
        <div className="mb-6 text-6xl">📊</div>
        <h2
          className="mb-4 text-4xl font-normal"
          style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: "var(--ink)" }}
        >
          Welcome to Vantro Flow
        </h2>
        <p className="mb-8 max-w-md text-base" style={{ color: "var(--ink-muted)", lineHeight: 1.7 }}>
          Upload your invoices to see your collections dashboard come alive with real data.
        </p>

        <div className="mb-12 flex flex-wrap justify-center gap-3">
          <Link href="/upload" className="apple-button apple-button-primary px-6 py-2.5 text-sm font-semibold">
            Upload CSV
          </Link>
          <button
            onClick={onAddManually}
            className="apple-button apple-button-secondary px-6 py-2.5 text-sm font-medium"
            style={{ color: "var(--ink-light)" }}
          >
            Add Invoice Manually
          </button>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="apple-button px-6 py-2.5 text-sm font-medium"
            style={{ background: "var(--cream)", border: "1px solid var(--border)", color: "var(--ink-muted)" }}
          >
            {seeding ? "Loading…" : "Load Demo Data"}
          </button>
        </div>

        <div className="grid w-full max-w-lg grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { icon: "📋", label: "Daily Follow-up", desc: "Never miss a payment reminder" },
            { icon: "🤖", label: "AI Reminders", desc: "Smart messages via WhatsApp" },
            { icon: "📈", label: "Cash Forecast", desc: "Know your inflow in advance" },
          ].map((f) => (
            <div
              key={f.label}
              className="rounded-2xl p-5 text-center"
              style={{ background: "var(--white)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
            >
              <div className="mb-2 text-2xl">{f.icon}</div>
              <div className="mb-1 text-xs font-semibold" style={{ color: "var(--ink-light)" }}>
                {f.label}
              </div>
              <div className="text-xs" style={{ color: "var(--ink-muted)", lineHeight: 1.5 }}>
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

/* ── main dashboard ──────────────────────────────── */

export default function HomePage() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [now, setNow] = useState<Date | null>(null);
  const [resolved, setResolved] = useState<Set<number>>(new Set());
  const [remindDone, setRemindDone] = useState<Set<number>>(new Set());
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    fetch("/api/dashboard")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: DashboardPayload) => {
        if (!ignore) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  async function handlePaid(invoiceId: number) {
    setActionLoading(invoiceId);
    try {
      await fetch(`/api/invoice/${invoiceId}/paid`, { method: "POST" });
      setResolved((p) => new Set(p).add(invoiceId));
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
      setRemindDone((p) => new Set(p).add(invoiceId));
    } finally {
      setActionLoading(null);
    }
  }

  const isEmpty = !loading && !!data && data.activeCustomers === 0 && data.totalOutstanding === 0;
  const followUp = (data?.followUpList ?? []).filter((i) => !resolved.has(i.id));

  const grandTotal =
    data
      ? (data.agingBuckets.current.amount +
          data.agingBuckets.aging1to30.amount +
          data.agingBuckets.aging31to60.amount +
          data.agingBuckets.aging60plus.amount) || 1
      : 1;

  const agingItems = data
    ? [
        {
          label: "Current",
          amount: data.agingBuckets.current.amount,
          count: data.agingBuckets.current.count,
          color: "var(--teal-primary)",
          pct: (data.agingBuckets.current.amount / grandTotal) * 100,
        },
        {
          label: "1–30 days",
          amount: data.agingBuckets.aging1to30.amount,
          count: data.agingBuckets.aging1to30.count,
          color: "var(--amber)",
          pct: (data.agingBuckets.aging1to30.amount / grandTotal) * 100,
        },
        {
          label: "31–60 days",
          amount: data.agingBuckets.aging31to60.amount,
          count: data.agingBuckets.aging31to60.count,
          color: "#E87B35",
          pct: (data.agingBuckets.aging31to60.amount / grandTotal) * 100,
        },
        {
          label: "60+ days",
          amount: data.agingBuckets.aging60plus.amount,
          count: data.agingBuckets.aging60plus.count,
          color: "var(--coral)",
          pct: (data.agingBuckets.aging60plus.amount / grandTotal) * 100,
        },
      ]
    : [];

  const kpiCards = data
    ? [
        {
          label: "Outstanding",
          value: `₹${fmt(data.totalOutstanding)}`,
          accentColor: "var(--coral)",
          valueColor: "var(--coral)",
          subtitle: "Open receivables",
        },
        {
          label: "Recovered",
          value: `₹${fmt(data.collectedThisMonth)}`,
          accentColor: "var(--sage)",
          valueColor: "var(--sage)",
          subtitle: "Collected this month",
        },
        {
          label: "Accounts",
          value: String(data.activeCustomers),
          accentColor: "var(--teal-primary)",
          valueColor: "var(--ink)",
          subtitle: "With open balance",
        },
        {
          label: "Recovery rate",
          value: `${data.collectionRate}%`,
          accentColor: "var(--amber)",
          valueColor: "var(--amber)",
          subtitle: "Of invoices cleared",
        },
      ]
    : [];

  const forecastItems = data
    ? [
        { label: "Promises due", value: `₹${fmt(data.weekForecast.promisesDue)}`, color: "var(--ink)" },
        { label: "Overdue risk", value: `₹${fmt(data.weekForecast.overdueRisk)}`, color: "var(--coral)" },
        { label: "Expected inflow", value: `₹${fmt(data.weekForecast.expectedThisWeek)}`, color: "var(--sage)" },
        { label: "Collection rate", value: `${data.collectionRate}%`, color: "var(--amber)" },
      ]
    : [];

  /* loading skeleton */
  if (loading && !data) {
    return (
      <main style={{ background: "var(--off-white)" }}>
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="mb-6 h-20 rounded-2xl shimmer" />
          <div className="mb-8 grid grid-cols-2 gap-5 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-2xl shimmer" />
            ))}
          </div>
          <div className="mb-5 h-40 rounded-2xl shimmer" />
          <div className="h-64 rounded-2xl shimmer" />
        </div>
      </main>
    );
  }

  if (isEmpty) {
    return (
      <>
        <EmptyState
          onDemoLoaded={() => setRefreshKey((k) => k + 1)}
          onAddManually={() => setShowAddForm(true)}
        />
        {showAddForm && (
          <AddInvoiceModal
            onSuccess={() => {
              setShowAddForm(false);
              setRefreshKey((k) => k + 1);
            }}
            onClose={() => setShowAddForm(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <main style={{ background: "var(--off-white)" }}>
        {data ? (
          <CollectionsGlobe
            originCity={data.organization.city}
            originCountry={data.organization.country}
            routes={data.networkRoutes}
            totalOutstanding={data.totalOutstanding}
          />
        ) : null}

        <div className="mx-auto max-w-6xl px-6 py-10">

          {/* ── HERO ─────────────────────────────────── */}
          <section className="mb-12 fade-up">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-2">
              <div>
                <p
                  className="text-xs uppercase mb-3"
                  style={{ color: "var(--ink-muted)", letterSpacing: "0.2em" }}
                >
                  Dashboard
                </p>
                <h1
                  className="text-5xl font-normal leading-tight"
                  style={{
                    fontFamily: "'Instrument Serif', Georgia, serif",
                    color: "var(--ink)",
                  }}
                >
                  Good {getTimeOfDay()}, Ishant.
                </h1>
              </div>

              {now && (
                <div
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                  style={{
                    background: "var(--teal-wash)",
                    border: "1px solid rgba(10,143,132,0.15)",
                  }}
                >
                  <span
                    className="h-2 w-2 rounded-full live-dot"
                    style={{ background: "var(--teal-primary)" }}
                  />
                  <span className="text-xs font-medium" style={{ color: "var(--teal-dark)" }}>
                    Live ·{" "}
                    {now.toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </span>
                </div>
              )}
            </div>
            <p className="mt-4 max-w-lg text-base" style={{ color: "var(--ink-muted)", lineHeight: 1.6 }}>
              Review open exposure, see where money is moving, and clear today&apos;s priorities.
            </p>
          </section>

          {/* ── KPI STRIP ─────────────────────────────── */}
          <section className="mb-10 grid grid-cols-2 gap-5 xl:grid-cols-4">
            {kpiCards.map((card, i) => (
              <div
                key={card.label}
                className={`rounded-2xl p-5 card-lift cursor-default fade-up-${Math.min(i + 1, 5)}`}
                style={{
                  background: "var(--white)",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div
                  className="mb-4 h-0.5 w-8 rounded-full"
                  style={{ background: card.accentColor }}
                />
                <p
                  className="mb-2 text-[11px] uppercase tracking-[0.15em]"
                  style={{ color: "var(--ink-muted)" }}
                >
                  {card.label}
                </p>
                <p
                  className="number-reveal text-3xl font-light tracking-tight"
                  style={{
                    fontFamily: "'Instrument Serif', Georgia, serif",
                    color: card.valueColor,
                  }}
                >
                  {card.value}
                </p>
                <p className="mt-2 text-xs" style={{ color: "var(--ink-muted)" }}>
                  {card.subtitle}
                </p>
              </div>
            ))}
          </section>

          {/* ── AGING VISUALIZATION ───────────────────── */}
          <section className="mb-10 fade-up-3">
            <p
              className="mb-4 text-[11px] uppercase tracking-[0.15em]"
              style={{ color: "var(--ink-muted)" }}
            >
              Aging distribution
            </p>
            <div
              className="rounded-2xl p-6"
              style={{
                background: "var(--white)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              {/* Stacked bar */}
              <div
                className="mb-6 flex h-3 overflow-hidden rounded-full"
                style={{ background: "var(--cream)", gap: "2px" }}
              >
                {agingItems.map(
                  (item, i) =>
                    item.pct > 0 && (
                      <div
                        key={i}
                        style={{
                          width: `${item.pct}%`,
                          background: item.color,
                          transition: `width 1s ease ${i * 0.1}s`,
                          minWidth: "4px",
                        }}
                      />
                    )
                )}
              </div>

              {/* Labels */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {agingItems.map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ background: item.color }}
                      />
                      <span className="text-xs" style={{ color: "var(--ink-muted)" }}>
                        {item.label}
                      </span>
                    </div>
                    <p
                      className="text-lg font-light"
                      style={{
                        fontFamily: "'Instrument Serif', Georgia, serif",
                        color: "var(--ink)",
                      }}
                    >
                      ₹{fmt(item.amount)}
                    </p>
                    <p className="text-[10px]" style={{ color: "var(--ink-muted)" }}>
                      {item.count} invoice{item.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── FOLLOW-UP LIST ────────────────────────── */}
          <section className="mb-10 fade-up-4">
            <div className="mb-4 flex items-center gap-3">
              <p
                className="text-[11px] uppercase tracking-[0.15em]"
                style={{ color: "var(--ink-muted)" }}
              >
                Priority queue
              </p>
              {followUp.length > 0 && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: "var(--coral-wash)", color: "var(--coral)" }}
                >
                  {followUp.length}
                </span>
              )}
            </div>

            <div
              className="overflow-hidden rounded-2xl"
              style={{ border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
            >
              {followUp.length === 0 ? (
                <div
                  className="p-12 text-center"
                  style={{ background: "var(--white)" }}
                >
                  <p
                    className="mb-2 text-2xl font-normal"
                    style={{
                      fontFamily: "'Instrument Serif', Georgia, serif",
                      color: "var(--ink)",
                    }}
                  >
                    All clear.
                  </p>
                  <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
                    No overdue invoices right now.
                  </p>
                </div>
              ) : (
                followUp.map((item, i) => {
                  const outstanding = Math.max(
                    Number(item.amount) - Number(item.amountPaid ?? 0),
                    0
                  );
                  const daysOverdue = item.daysOverdue ?? 0;
                  const isUrgent = daysOverdue > 60;
                  const initials = item.customerName
                    .split(" ")
                    .map((w: string) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                  const isActing = actionLoading === item.id;
                  const reminded = remindDone.has(item.id);

                  return (
                    <div
                      key={item.id}
                      className="group flex items-center gap-4 px-5 py-4"
                      style={{
                        background: i % 2 === 0 ? "var(--white)" : "var(--off-white)",
                        borderBottom:
                          i < followUp.length - 1 ? "1px solid var(--border)" : "none",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background =
                          "var(--teal-wash)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background =
                          i % 2 === 0 ? "var(--white)" : "var(--off-white)";
                      }}
                    >
                      {/* Avatar */}
                      <div
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                        style={{
                          background: isUrgent ? "var(--coral-wash)" : "var(--teal-wash)",
                          color: isUrgent ? "var(--coral)" : "var(--teal-dark)",
                        }}
                      >
                        {initials}
                      </div>

                      {/* Name + invoice */}
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/customers/${item.customerId}`}
                          className="block truncate text-sm font-medium"
                          style={{ color: "var(--ink)" }}
                        >
                          {item.customerName}
                        </Link>
                        <p className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
                          {item.invoiceNumber}
                        </p>
                      </div>

                      {/* Days badge */}
                      <span
                        className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{
                          background: isUrgent ? "var(--coral-wash)" : "var(--amber-wash)",
                          color: isUrgent ? "var(--coral)" : "var(--amber)",
                        }}
                      >
                        {daysOverdue}d
                      </span>

                      {/* Amount */}
                      <p
                        className="w-28 flex-shrink-0 text-right text-sm font-medium"
                        style={{ color: "var(--ink)" }}
                      >
                        ₹{fmt(outstanding)}
                      </p>

                      {/* Hover actions */}
                      <div className="flex flex-shrink-0 gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          disabled={isActing || reminded}
                          onClick={() => handleRemind(item.id, item.customerId)}
                          className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors"
                          style={{
                            background: reminded ? "var(--sage-wash)" : "var(--teal-wash)",
                            color: reminded ? "var(--sage)" : "var(--teal-dark)",
                            cursor: isActing ? "wait" : "pointer",
                          }}
                        >
                          {reminded ? "Sent ✓" : "Remind"}
                        </button>
                        <button
                          disabled={isActing}
                          onClick={() => handlePaid(item.id)}
                          className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors"
                          style={{
                            background: "var(--sage-wash)",
                            color: "var(--sage)",
                            cursor: isActing ? "wait" : "pointer",
                          }}
                        >
                          Paid
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* ── WEEK FORECAST STRIP ───────────────────── */}
          <section className="mb-10 grid grid-cols-2 gap-4 fade-up-5 xl:grid-cols-4">
            {forecastItems.map((item) => (
              <div
                key={item.label}
                className="rounded-xl px-4 py-3"
                style={{ background: "var(--cream)", border: "1px solid var(--border)" }}
              >
                <p
                  className="mb-1 text-[10px] uppercase tracking-[0.15em]"
                  style={{ color: "var(--ink-muted)" }}
                >
                  {item.label}
                </p>
                <p
                  className="text-lg font-light"
                  style={{
                    fontFamily: "'Instrument Serif', Georgia, serif",
                    color: item.color,
                  }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </section>

        </div>
      </main>

      {showAddForm && (
        <AddInvoiceModal
          onSuccess={() => {
            setShowAddForm(false);
            setRefreshKey((k) => k + 1);
          }}
          onClose={() => setShowAddForm(false)}
        />
      )}
    </>
  );
}
