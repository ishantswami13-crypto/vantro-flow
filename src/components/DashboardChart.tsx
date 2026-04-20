"use client";

interface Props {
  chartData: number[];
  chartLabels: string[];
}

function createSparklinePath(values: number[], width: number, height: number, padding: number) {
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

function createAreaPath(values: number[], width: number, height: number, padding: number) {
  if (values.length === 0) {
    return "";
  }

  const line = createSparklinePath(values, width, height, padding);
  const step = values.length > 1 ? (width - padding * 2) / (values.length - 1) : 0;
  const startX = padding;
  const endX = padding + step * (values.length - 1);
  const baseline = height - padding;

  return `${line} L ${endX} ${baseline} L ${startX} ${baseline} Z`;
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value || 0);
}

export default function DashboardChart({ chartData, chartLabels }: Props) {
  const width = 720;
  const height = 280;
  const padding = 20;
  const linePath = createSparklinePath(chartData, width, height, padding);
  const areaPath = createAreaPath(chartData, width, height, padding);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[28px] border bg-white p-5" style={{ borderColor: "var(--border)" }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Outstanding trend">
          <defs>
            <linearGradient id="dashboard-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(10,143,132,0.22)" />
              <stop offset="100%" stopColor="rgba(10,143,132,0.02)" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#dashboard-area)" />
          <path d={linePath} fill="none" stroke="var(--teal-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {chartData.map((value, index) => {
            const max = Math.max(...chartData, 1);
            const min = Math.min(...chartData, 0);
            const range = Math.max(max - min, 1);
            const step = chartData.length > 1 ? (width - padding * 2) / (chartData.length - 1) : 0;
            const x = padding + step * index;
            const y = height - padding - ((value - min) / range) * (height - padding * 2);

            return <circle key={`${value}-${index}`} cx={x} cy={y} r="4" fill="var(--teal-primary)" />;
          })}
        </svg>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {chartData.map((value, index) => (
          <div key={`${chartLabels[index]}-${index}`} className="rounded-[20px] border bg-[var(--off-white)] px-4 py-3" style={{ borderColor: "var(--border)" }}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--ink-muted)" }}>
              {chartLabels[index] ?? `Point ${index + 1}`}
            </div>
            <div className="mt-2 text-base font-semibold tracking-[-0.03em]" style={{ color: "var(--ink)" }}>
              Rs {formatCompactCurrency(value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
