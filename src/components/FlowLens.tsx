"use client";

import CountUp from "@/components/CountUp";

type FlowState = {
  label: string;
  value: number;
  color: string;
  soft: string;
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
    {
      label: "Moving",
      value: moving,
      color: "var(--success)",
      soft: "var(--success-soft)",
      description: "Cash already collected or actively converting.",
    },
    {
      label: "Expected",
      value: expected,
      color: "var(--brand-primary)",
      soft: "var(--brand-primary-soft)",
      description: "Inflow expected inside the active forecast window.",
    },
    {
      label: "Stuck",
      value: stuck,
      color: "var(--warning)",
      soft: "var(--warning-soft)",
      description: "Past-due money slowing the operating rhythm.",
    },
    {
      label: "At Risk",
      value: atRisk,
      color: "var(--danger)",
      soft: "var(--danger-soft)",
      description: "Critical exposure that can damage forecast confidence.",
    },
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
  const riskPressure = Math.round(((stuck + atRisk) / total) * 100);

  return (
    <section className="vf-command-surface rounded-[28px] p-5 sm:p-6" aria-label="Flow Lens money state map">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="apple-eyebrow">Flow Lens 3.0</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-normal text-[var(--text-primary)]">
            Money state map
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--text-tertiary)]">
            Vantro separates money that is moving, expected, stuck, and at risk so the next action is obvious.
          </p>
        </div>
        <span className="hidden rounded-full px-3 py-1 text-xs font-semibold text-[var(--brand-primary)] sm:inline-flex"
          style={{ background: "var(--brand-primary-soft)", border: "1px solid rgba(79,140,255,0.24)" }}>
          Signature view
        </span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)] xl:items-center">
        <div className="mx-auto grid h-[260px] w-[260px] place-items-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-1)] shadow-[var(--shadow-card)]">
          <div
            className="relative grid h-[214px] w-[214px] place-items-center rounded-full"
            style={{
              background: `conic-gradient(${segments})`,
              boxShadow: "inset 0 0 42px rgba(0,0,0,0.52), 0 0 46px rgba(79,140,255,0.12)",
            }}
          >
            <span className="absolute inset-[-12px] rounded-full border border-[var(--border-subtle)] opacity-60" />
            <span
              className="absolute h-[70%] w-[70%] rounded-full"
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                animation: "pulse-ring 3.2s ease-out infinite",
              }}
              aria-hidden="true"
            />
            <div className="grid h-[144px] w-[144px] place-items-center rounded-full border border-[var(--border-subtle)] bg-[var(--background)] text-center">
              <span>
                <span className="block text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Total signal
                </span>
                <span className="serif tabular block text-2xl text-[var(--text-primary)]">
                  <CountUp value={total} prefix="₹" />
                </span>
                <span className="mt-1 block text-[11px] text-[var(--text-tertiary)]">
                  {riskPressure}% pressure
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {states.map((state) => {
            const share = Math.round(pct(state.value, total));
            return (
              <article
                key={state.label}
                className="vf-hover-depth rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-glass)] p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                    <span className="h-2 w-2 rounded-full" style={{ background: state.color, boxShadow: `0 0 16px ${state.color}` }} />
                    {state.label}
                  </span>
                  <span className="mono rounded-full px-2 py-0.5 text-[10px] text-[var(--text-secondary)]"
                    style={{ background: state.soft, border: "1px solid var(--border-subtle)" }}>
                    {share}%
                  </span>
                </div>
                <p className="serif tabular text-2xl text-[var(--text-primary)]">
                  <CountUp value={state.value} prefix="₹" />
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${share}%`,
                      background: state.color,
                      animation: "bar-grow 800ms var(--ease-spring) forwards",
                    }}
                  />
                </div>
                <p className="mt-3 text-xs leading-5 text-[var(--text-tertiary)]">{state.description}</p>
              </article>
            );
          })}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]">
        {atRisk > 0
          ? `Risk is concentrated in ${Math.max(riskPressure, 1)}% of the flow signal. Prioritize at-risk accounts before expanding the forecast.`
          : "The current book is stable. Keep forecast confidence high by clearing stuck receivables before they move into risk."}
      </div>
    </section>
  );
}
