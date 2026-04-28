"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import CountUp from "@/components/CountUp";

export default function MetricCard({
  label,
  value,
  prefix = "",
  suffix = "",
  sub,
  icon: Icon,
  tone = "var(--teal)",
  delay = 0,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  sub?: string;
  icon: LucideIcon;
  tone?: string;
  delay?: number;
}) {
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  return (
    <div
      className="group relative overflow-hidden rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-2)] transition duration-300 hover:-translate-y-0.5 hover:border-[var(--line-2)]"
      style={{ "--mouse-x": `${coords.x}px`, "--mouse-y": `${coords.y}px`, animationDelay: `${delay}ms` } as React.CSSProperties}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setCoords({ x: event.clientX - rect.left, y: event.clientY - rect.top });
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle 220px at var(--mouse-x) var(--mouse-y), ${tone}18, transparent)` }}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-4)]">{label}</p>
          <p className="vf-number tabular text-3xl text-[var(--ink)]">
            <CountUp value={value} prefix={prefix} suffix={suffix} duration={1000} />
          </p>
          {sub ? <p className="mt-3 text-xs leading-5 text-[var(--ink-3)]">{sub}</p> : null}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ background: `${tone}18`, color: tone }}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
