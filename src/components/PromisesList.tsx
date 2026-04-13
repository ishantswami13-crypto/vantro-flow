"use client";

import { useState } from "react";

interface PromiseItem { id: number; customer_name: string; customer_id: number; promised_amount: string | null; invoice_number: string; notes: string | null; }
interface Props { items: PromiseItem[]; }

function fmt(n: string | number | null) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    typeof n === "string" ? parseFloat(n) : (n ?? 0)
  );
}

export default function PromisesList({ items }: Props) {
  const [resolved, setResolved] = useState<Map<number, "received" | "broken">>(new Map());
  const [loading, setLoading] = useState<number | null>(null);

  async function handleAction(id: number, action: "received" | "broken") {
    setLoading(id);
    try { await fetch(`/api/promise/${id}/${action}`, { method: "POST" }); setResolved((p) => new Map(p).set(id, action)); }
    finally { setLoading(null); }
  }

  const visible = items.filter((p) => !resolved.has(p.id));
  if (visible.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-5">
        <h2 className="font-syne font-bold text-[#F8FAFC] text-xl">🤝 Promises Due Today</h2>
        <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: "rgba(139,92,246,0.12)", color: "#8B5CF6", border: "1px solid rgba(139,92,246,0.25)" }}>
          {visible.length} expected
        </span>
      </div>
      <div className="space-y-3">
        {visible.map((p) => (
          <div key={p.id} className="rounded-2xl px-5 py-4 flex items-center justify-between"
            style={{ background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.15)" }}>
            <div className="flex-1 min-w-0">
              <a href={`/customers/${p.customer_id}`} className="font-syne font-bold text-[#F8FAFC] hover:text-[#8B5CF6] transition-colors block truncate">{p.customer_name}</a>
              <p className="text-xs text-[#475569] mt-0.5">{p.invoice_number}{p.notes ? ` · ${p.notes}` : ""}</p>
            </div>
            <div className="flex items-center gap-4 ml-4">
              <div className="text-right mr-1">
                <p className="font-syne font-bold text-lg text-[#8B5CF6]">{fmt(p.promised_amount)}</p>
                <p className="text-xs text-[#475569]">promised today</p>
              </div>
              <button onClick={() => handleAction(p.id, "received")} disabled={loading === p.id}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white whitespace-nowrap transition-all"
                style={{ background: "linear-gradient(135deg, #059669, #10B981)", opacity: loading === p.id ? 0.6 : 1 }}>
                ✓ Received
              </button>
              <button onClick={() => handleAction(p.id, "broken")} disabled={loading === p.id}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
                style={{ color: "#F43F5E", border: "1px solid rgba(244,63,94,0.3)", background: "rgba(244,63,94,0.06)", opacity: loading === p.id ? 0.6 : 1 }}>
                ✗ Broken
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
