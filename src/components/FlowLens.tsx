"use client";

import CountUp from "@/components/CountUp";

type FlowState = {
  label: string;
  value: number;
  color: string;
  description: string;
};

function pct(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.max((value / total) * 100, value > 0 ? 3 : 0);
}

export default function FlowLens({
  moving,
  expected,
  stuck,
  atRisk,
}: {
  moving: number;
  expected: number;
  stuck: number;
  atRisk: number;
}) {
  const states: FlowState[] = [
    { label: "Moving", value: moving, color: "var(--success)", description: "Collected or converting" },
    { label: "Expected", value: expected, color: "var(--info)", description: "Due within forecast" },
    { label: "Stuck", value: stuck, color: "var(--warning)", description: "Past due and slowing cash" },
    { label: "At Risk", value: atRisk, color: "var(--danger)", description: "Critical recovery exposure" },
  ];
  const total = Math.max(states.reduce((sum, state) => sum + state.value, 0), 1);
  let cursor = 0;
  const segments = states
    .map((state) => {
      const start = cursor;
      const end = cursor + pct(state.value, total);
      cursor = end;
      return `${state.color} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <div className="vf-card relative overflow-hidden rounded-[28px] p-6">
      <div className="pointer-events-none absolute inset-0 vf-grid opacity-20" aria-hidden="true" />
      <div className="relative mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="apple-eyebrow">Flow Lens</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-normal text-[var(--text-primary)]">
            Money state map
          </h2>
        </div>
        <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-glass)] px-3 py-1 text-xs text-[var(--text-secondary)]">
          Signature signal
        </span>
      </div>

      <div className="relative grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-center">
        <div className="mx-auto grid h-[220px] w-[220px] place-items-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-base)] shadow-[var(--shadow-card)]">
          <div
            className="grid h-[178px] w-[178px] place-items-center rounded-full transition"
            style={{
              background: `conic-gradient(${segments})`,
              boxShadow: "inset 0 0 42px rgba(0,0,0,0.45)",
            }}
          >
            <div className="grid h-[122px] w-[122px] place-items-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-obsidian)] text-center">
              <span>
                <span className="block text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)]">In lens</span>
                <span className="vf-number tabular block text-xl text-[var(--text-primary)]">
                  <CountUp value={total} prefix="₹" />
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {states.map((state) => (
            <div key={state.label} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-glass)] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  <span className="h-2 w-2 rounded-full" style={{ background: state.color }} />
                  {state.label}
                </span>
                <span className="mono text-xs text-[var(--text-muted)]">{Math.round(pct(state.value, total))}%</span>
              </div>
              <p className="vf-number tabular text-2xl text-[var(--text-primary)]">
                <CountUp value={state.value} prefix="₹" />
              </p>
              <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">{state.description}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="relative mt-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--info-soft)] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]">
        Flow Lens separates healthy movement from stuck and at-risk exposure, so teams can decide whether to accelerate collections, protect forecast, or escalate risk.
      </p>
    </div>
  );
}
