"use client";

interface Props {
  outstanding: number;
  overdueRisk: number;
  expectedThisWeek: number;
}

function buildSeries(outstanding: number, overdueRisk: number, expectedThisWeek: number) {
  const labels: string[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    labels.push(d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }));
  }

  const base = Number(outstanding) || 0;
  const risk = Number(overdueRisk) || 0;
  const expected = Number(expectedThisWeek) || 0;
  const step = expected > 0 ? expected / 7 : risk * 0.05;
  const values = labels.map((_, index) => Math.max(0, base - step * index * (0.6 + index * 0.08)));

  return { labels, values };
}

function createPath(values: number[], width: number, height: number, padding: number) {
  if (values.length === 0) {
    return "";
  }

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const step = values.length > 1 ? (width - padding * 2) / (values.length - 1) : 0;

  return values
    .map((value, index) => {
      const x = padding + step * index;
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function createArea(values: number[], width: number, height: number, padding: number) {
  if (values.length === 0) {
    return "";
  }

  const line = createPath(values, width, height, padding);
  const step = values.length > 1 ? (width - padding * 2) / (values.length - 1) : 0;
  const endX = padding + step * (values.length - 1);
  const baseline = height - padding;

  return `${line} L ${endX} ${baseline} L ${padding} ${baseline} Z`;
}

export default function CashFlowChart({ outstanding, overdueRisk, expectedThisWeek }: Props) {
  const { labels, values } = buildSeries(outstanding, overdueRisk, expectedThisWeek);
  const width = 640;
  const height = 220;
  const padding = 18;
  const path = createPath(values, width, height, padding);
  const area = createArea(values, width, height, padding);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[24px] border bg-white px-4 py-4" style={{ borderColor: "var(--border)" }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Cash flow chart">
          <defs>
            <linearGradient id="cashflow-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(10,143,132,0.24)" />
              <stop offset="100%" stopColor="rgba(10,143,132,0.02)" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#cashflow-fill)" />
          <path d={path} fill="none" stroke="var(--teal-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Outstanding", value: outstanding, color: "var(--ink)" },
          { label: "Overdue risk", value: overdueRisk, color: "var(--coral)" },
          { label: "Expected this week", value: expectedThisWeek, color: "var(--sage)" },
        ].map((item) => (
          <div key={item.label} className="rounded-[20px] border bg-[var(--off-white)] px-4 py-3" style={{ borderColor: "var(--border)" }}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--ink-muted)" }}>
              {item.label}
            </div>
            <div className="mt-2 text-sm font-semibold" style={{ color: item.color }}>
              Rs {new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(item.value || 0)}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 text-xs" style={{ color: "var(--ink-muted)" }}>
        {labels.map((label) => (
          <span key={label} className="rounded-full bg-[var(--cream)] px-3 py-1">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
