"use client";

type RiskLevel = "safe" | "watchlist" | "high" | "overdue" | "critical";

const riskConfig: Record<RiskLevel, { label: string; bg: string; color: string; border: string }> = {
  safe: {
    label: "Safe",
    bg: "var(--sage-wash)",
    color: "var(--sage)",
    border: "rgba(52, 211, 153, 0.22)",
  },
  watchlist: {
    label: "Watchlist",
    bg: "var(--teal-wash)",
    color: "var(--teal)",
    border: "rgba(32, 217, 246, 0.22)",
  },
  high: {
    label: "High risk",
    bg: "var(--amber-wash)",
    color: "var(--amber)",
    border: "rgba(251, 191, 36, 0.24)",
  },
  overdue: {
    label: "Overdue",
    bg: "var(--coral-wash)",
    color: "var(--coral)",
    border: "rgba(251, 113, 133, 0.24)",
  },
  critical: {
    label: "Critical",
    bg: "rgba(244, 63, 94, 0.16)",
    color: "#FDA4AF",
    border: "rgba(251, 113, 133, 0.34)",
  },
};

export function getRiskLevel(daysOverdue: number, outstanding = 0): RiskLevel {
  if (daysOverdue >= 75 || outstanding >= 500000) return "critical";
  if (daysOverdue >= 45) return "overdue";
  if (daysOverdue >= 21) return "high";
  if (daysOverdue > 0 || outstanding > 0) return "watchlist";
  return "safe";
}

export default function RiskBadge({
  level,
  label,
}: {
  level: RiskLevel;
  label?: string;
}) {
  const config = riskConfig[level];

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ background: config.bg, color: config.color, border: `1px solid ${config.border}` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: config.color }} />
      {label ?? config.label}
    </span>
  );
}
