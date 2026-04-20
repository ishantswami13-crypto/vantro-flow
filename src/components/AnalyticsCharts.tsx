"use client";

interface AgingRow {
  bucket: string | null;
  total: number;
  count: number;
}

interface MonthlyRow {
  month: string;
  month_order: string;
  collected: number;
  count: number;
}

interface TopCustomer {
  id: number;
  name: string;
  outstanding: number;
  overdue_invoices: number;
}

interface Props {
  aging: AgingRow[];
  monthly: MonthlyRow[];
  topCustomers: TopCustomer[];
  collectionRate: number;
}

const BUCKET_ORDER = ["current", "1-30", "31-60", "60+"];
const BUCKET_LABELS: Record<string, string> = {
  current: "Current",
  "1-30": "1-30 Days",
  "31-60": "31-60 Days",
  "60+": "60+ Days",
};
const BUCKET_COLORS = ["var(--teal-primary)", "var(--amber)", "#E87B35", "var(--coral)"];

function formatCurrency(value: number | string) {
  const n = typeof value === "string" ? Number.parseFloat(value) : value;
  return `Rs ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n || 0)}`;
}

export default function AnalyticsCharts({ aging, monthly, topCustomers, collectionRate }: Props) {
  const agingRows = BUCKET_ORDER.map((bucket, index) => {
    const match = aging.find((entry) => entry.bucket === bucket);
    return {
      label: BUCKET_LABELS[bucket],
      total: match?.total ?? 0,
      count: match?.count ?? 0,
      color: BUCKET_COLORS[index],
    };
  });
  const maxAging = Math.max(...agingRows.map((row) => row.total), 1);
  const maxMonthly = Math.max(...monthly.map((row) => row.collected), 1);
  const ringAngle = Math.max(Math.min(collectionRate, 100), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div
          className="xl:col-span-2 rounded-[32px] p-6"
          style={{ background: "rgba(255,255,255,0.82)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
        >
          <div className="mb-6">
            <h2 className="text-lg font-semibold tracking-[-0.03em]" style={{ color: "var(--text-1)" }}>
              Aging distribution
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
              The 60+ day bucket marks your highest collection risk.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {agingRows.map((row) => {
              const height = Math.max((row.total / maxAging) * 180, row.total > 0 ? 18 : 10);

              return (
                <div key={row.label} className="rounded-[24px] p-4" style={{ background: "var(--off-white)" }}>
                  <div className="flex h-[200px] items-end">
                    <div className="w-full rounded-[18px] px-3 pb-3 pt-4 transition-[height] duration-700" style={{ height, background: `${row.color}18` }}>
                      <div className="h-full rounded-[14px]" style={{ background: row.color }} />
                    </div>
                  </div>
                  <div className="mt-4 text-sm font-semibold" style={{ color: "var(--ink)" }}>
                    {row.label}
                  </div>
                  <div className="mt-1 text-sm" style={{ color: "var(--ink-light)" }}>
                    {formatCurrency(row.total)}
                  </div>
                  <div className="mt-1 text-xs" style={{ color: "var(--ink-muted)" }}>
                    {row.count} invoice{row.count !== 1 ? "s" : ""}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="rounded-[32px] p-6"
          style={{ background: "rgba(255,255,255,0.82)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
        >
          <h2 className="text-lg font-semibold tracking-[-0.03em]" style={{ color: "var(--text-1)" }}>
            Collection rate
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
            Paid invoices versus pending inventory.
          </p>

          <div className="relative mt-6 flex items-center justify-center">
            <div
              className="relative h-[240px] w-[240px] rounded-full"
              style={{
                background: `conic-gradient(var(--teal-primary) ${ringAngle}%, var(--cream) ${ringAngle}% 100%)`,
              }}
            >
              <div
                className="absolute inset-[22px] rounded-full"
                style={{ background: "var(--white)", border: "1px solid var(--border)" }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-semibold tracking-[-0.05em]" style={{ color: "var(--accent)" }}>
                  {collectionRate}%
                </span>
                <span className="text-xs uppercase tracking-[0.18em]" style={{ color: "var(--text-4)" }}>
                  collected
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {[
              { label: "Collected", color: "var(--teal-primary)", value: collectionRate },
              { label: "Outstanding", color: "var(--border-hover)", value: 100 - collectionRate },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                  <span style={{ color: "var(--text-3)" }}>{item.label}</span>
                </div>
                <span className="font-semibold" style={{ color: "var(--text-1)" }}>
                  {item.value}%
                </span>
              </div>
            ))}
          </div>

          {topCustomers.length > 0 ? (
            <div className="mt-6 border-t pt-4" style={{ borderColor: "var(--border)" }}>
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-4)" }}>
                Largest balances
              </div>
              <div className="space-y-2">
                {topCustomers.slice(0, 3).map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between text-xs">
                    <span className="truncate pr-3" style={{ color: "var(--ink-light)" }}>
                      {customer.name}
                    </span>
                    <span className="font-semibold" style={{ color: "var(--ink)" }}>
                      {formatCurrency(customer.outstanding)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {monthly.length > 0 ? (
        <div
          className="rounded-[32px] p-6"
          style={{ background: "rgba(255,255,255,0.82)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
        >
          <div className="mb-6">
            <h2 className="text-lg font-semibold tracking-[-0.03em]" style={{ color: "var(--text-1)" }}>
              Monthly collections
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
              Paid invoice volume over the last six months.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            {monthly.map((row, index) => {
              const height = Math.max((row.collected / maxMonthly) * 180, row.collected > 0 ? 18 : 8);

              return (
                <div key={`${row.month_order}-${index}`} className="rounded-[24px] p-4" style={{ background: "var(--off-white)" }}>
                  <div className="flex h-[200px] items-end">
                    <div
                      className="w-full rounded-[18px] transition-[height] duration-700"
                      style={{
                        height,
                        background: "linear-gradient(180deg, rgba(10,143,132,0.12) 0%, rgba(10,143,132,0.95) 100%)",
                      }}
                    />
                  </div>
                  <div className="mt-4 text-sm font-semibold" style={{ color: "var(--ink)" }}>
                    {row.month}
                  </div>
                  <div className="mt-1 text-sm" style={{ color: "var(--ink-light)" }}>
                    {formatCurrency(row.collected)}
                  </div>
                  <div className="mt-1 text-xs" style={{ color: "var(--ink-muted)" }}>
                    {row.count} invoice{row.count !== 1 ? "s" : ""}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
