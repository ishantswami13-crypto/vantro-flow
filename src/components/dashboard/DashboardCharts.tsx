"use client";

import type { DashboardPayload } from "./types";
import { formatIndian, shortDateLabel } from "./utils";

interface Props {
  data: DashboardPayload;
}

function createSparkline(values: number[], width: number, height: number, padding: number) {
  if (values.length === 0) {
    return { line: "", area: "" };
  }

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const step = values.length > 1 ? (width - padding * 2) / (values.length - 1) : 0;

  const points = values.map((value, index) => {
    const x = padding + step * index;
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const line = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const baseline = height - padding;
  const area = `${line} L ${points[points.length - 1]?.x ?? padding} ${baseline} L ${points[0]?.x ?? padding} ${baseline} Z`;

  return { line, area, points };
}

export default function DashboardCharts({ data }: Props) {
  const values = data.last7Days.map((item) => item.amount);
  const width = 720;
  const height = 280;
  const padding = 24;
  const { line, area, points = [] } = createSparkline(values, width, height, padding);

  return (
    <div className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
      <div
        className="xl:col-span-2 rounded-[20px] p-5"
        style={{ background: "var(--bg-surface)", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }}
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold tracking-[-0.03em]" style={{ color: "var(--text-1)" }}>
              Daily outstanding
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
              Seven-day view of the open receivables book.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="linear-tag">7D</span>
            <span className="linear-tag">Live</span>
          </div>
        </div>

        <div className="overflow-hidden rounded-[18px] bg-[var(--off-white)] p-4">
          <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Daily outstanding chart">
            <defs>
              <linearGradient id="dashboard-shell-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgba(10,143,132,0.18)" />
                <stop offset="100%" stopColor="rgba(10,143,132,0.02)" />
              </linearGradient>
            </defs>
            <path d={area} fill="url(#dashboard-shell-area)" />
            <path d={line} fill="none" stroke="var(--teal-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {points.map((point, index) => (
              <circle key={`${point.x}-${index}`} cx={point.x} cy={point.y} r="4" fill="var(--teal-primary)" />
            ))}
          </svg>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {data.last7Days.slice(-4).map((item) => (
            <div key={item.date} className="rounded-[18px] border bg-[var(--off-white)] px-4 py-3" style={{ borderColor: "var(--border)" }}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-4)" }}>
                {shortDateLabel(item.date)}
              </div>
              <div className="mt-2 text-sm font-semibold tracking-[-0.02em]" style={{ color: "var(--text-1)" }}>
                {formatIndian(item.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="rounded-[20px] p-5"
        style={{ background: "var(--bg-surface)", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }}
      >
        <h2 className="text-base font-semibold tracking-[-0.03em]" style={{ color: "var(--text-1)" }}>
          Collection rate
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
          Paid invoices against pending inventory.
        </p>

        <div className="relative mb-4 mt-5 flex items-center justify-center">
          <div
            className="relative h-[210px] w-[210px] rounded-full"
            style={{
              background: `conic-gradient(var(--teal-primary) ${data.collectionRate || 0}%, var(--cream) ${data.collectionRate || 0}% 100%)`,
            }}
          >
            <div className="absolute inset-[22px] rounded-full bg-white" style={{ border: "1px solid var(--border)" }} />
            <div className="absolute inset-0 text-center">
              <div className="mt-[76px] text-4xl font-semibold tracking-[-0.05em]" style={{ color: "var(--accent)" }}>
                {data.collectionRate}%
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-4)" }}>
                Collected
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2 border-t pt-4" style={{ borderColor: "var(--border)" }}>
          {[
            { label: "Paid", color: "var(--teal-primary)", value: data.collectionRate },
            { label: "Pending", color: "var(--border-hover)", value: 100 - (data.collectionRate || 0) },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                <span style={{ color: "var(--text-3)" }}>{item.label}</span>
              </div>
              <span className="font-semibold" style={{ color: "var(--text-1)" }}>
                {item.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
