"use client";

import { useState } from "react";
import InvoiceActions from "./InvoiceActions";

interface FollowUpItem {
  invoice_id: number;
  customer_id: number;
  customer_name: string;
  invoice_number: string;
  amount: string;
  amount_paid: string | null;
  days_overdue: number | null;
  due_date: string | null;
}

interface Props { items: FollowUpItem[]; }

function fmt(n: number) {
  return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n || 0)}`;
}

function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}

function severity(d: number | null) {
  const days = d ?? 0;
  if (days >= 60) return { color: "#F43F5E", glow: "rgba(244,63,94,0.18)", badgeBg: "rgba(244,63,94,0.1)", badgeBorder: "rgba(244,63,94,0.25)", label: `${days}d overdue` };
  if (days >= 30) return { color: "#F97316", glow: "rgba(249,115,22,0.18)", badgeBg: "rgba(249,115,22,0.1)", badgeBorder: "rgba(249,115,22,0.25)", label: `${days}d overdue` };
  return { color: "#F59E0B", glow: "rgba(245,158,11,0.18)", badgeBg: "rgba(245,158,11,0.1)", badgeBorder: "rgba(245,158,11,0.25)", label: `${days}d overdue` };
}

export default function FollowUpList({ items }: Props) {
  const [paidIds, setPaidIds] = useState<Set<number>>(new Set());
  const visible = items.filter((f) => !paidIds.has(f.invoice_id));

  if (visible.length === 0) {
    return (
      <div className="rounded-2xl p-16 text-center" style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="float-emoji text-5xl mb-4">🎉</div>
        <p className="font-syne font-bold text-[#F8FAFC] text-xl">All caught up!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visible.map((f) => {
        const outstanding = parseFloat(f.amount) - parseFloat(f.amount_paid ?? "0");
        const { color, glow, badgeBg, badgeBorder, label } = severity(f.days_overdue);
        return (
          <div
            key={f.invoice_id}
            className="followup-row rounded-2xl p-5"
            style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-syne font-bold text-sm"
                style={{ background: `${color}15`, color, boxShadow: `0 0 12px ${glow}` }}
              >
                {initials(f.customer_name)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <a href={`/customers/${f.customer_id}`} className="font-syne font-bold text-[#F8FAFC] hover:text-[#0D9488] transition-colors block truncate">
                  {f.customer_name}
                </a>
                <p className="text-xs text-[#475569] mt-0.5">{f.invoice_number} · Due {f.due_date ?? "—"}</p>
              </div>

              {/* Badge */}
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap shrink-0"
                style={{ background: badgeBg, color, border: `1px solid ${badgeBorder}` }}
              >
                {label}
              </span>

              {/* Amount + actions */}
              <div className="flex items-center gap-4 shrink-0">
                <p className="font-syne font-bold text-lg whitespace-nowrap" style={{ color }}>{fmt(outstanding)}</p>
                <InvoiceActions
                  customerId={f.customer_id}
                  invoiceId={f.invoice_id}
                  amount={outstanding}
                  onPaid={() => setPaidIds((prev) => new Set(prev).add(f.invoice_id))}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
