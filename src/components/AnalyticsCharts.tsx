"use client";

import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

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
const BUCKET_COLORS = ["#0071E3", "#A15C17", "#C97415", "#C2471A"];

function formatCurrency(value: number | string) {
  const n = typeof value === "string" ? Number.parseFloat(value) : value;
  return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n || 0)}`;
}

export default function AnalyticsCharts({ aging, monthly, collectionRate }: Props) {
  const agingValues = BUCKET_ORDER.map((bucket) => aging.find((entry) => entry.bucket === bucket)?.total ?? 0);

  const barOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "white",
        borderColor: "rgba(29,29,31,0.08)",
        borderWidth: 1,
        titleColor: "#6E6E73",
        bodyColor: "#1D1D1F",
        callbacks: {
          label: (context) => ` ${formatCurrency(context.parsed.y ?? 0)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#86868B" },
        border: { display: false },
      },
      y: {
        grid: { color: "rgba(29,29,31,0.05)" },
        ticks: {
          color: "#86868B",
          callback: (value) => {
            const numericValue = Number(value);
            if (numericValue >= 100000) {
              return `₹${(numericValue / 100000).toFixed(1)}L`;
            }
            if (numericValue >= 1000) {
              return `₹${(numericValue / 1000).toFixed(0)}K`;
            }
            return `₹${numericValue}`;
          },
        },
        border: { display: false },
      },
    },
  };

  const doughnutOptions: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "75%",
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div
          className="xl:col-span-2 rounded-[32px] p-6"
          style={{ background: "rgba(255,255,255,0.74)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
        >
          <div className="mb-6">
            <h2 className="text-lg font-semibold tracking-[-0.03em]" style={{ color: "var(--text-1)" }}>
              Aging distribution
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
              The 60+ day bucket marks your highest collection risk.
            </p>
          </div>

          <div className="h-[320px]">
            <Bar
              data={{
                labels: BUCKET_ORDER.map((bucket) => BUCKET_LABELS[bucket]),
                datasets: [
                  {
                    data: agingValues,
                    backgroundColor: BUCKET_COLORS.map((color) => `${color}22`),
                    borderColor: BUCKET_COLORS,
                    borderWidth: 2,
                    borderRadius: 10,
                    borderSkipped: false,
                  },
                ],
              }}
              options={barOptions}
            />
          </div>
        </div>

        <div
          className="rounded-[32px] p-6"
          style={{ background: "rgba(255,255,255,0.74)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
        >
          <h2 className="text-lg font-semibold tracking-[-0.03em]" style={{ color: "var(--text-1)" }}>
            Collection rate
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
            Paid invoices versus pending inventory.
          </p>

          <div className="relative mt-6 h-[240px]">
            <Doughnut
              data={{
                labels: ["Collected", "Outstanding"],
                datasets: [
                  {
                    data: [collectionRate, 100 - collectionRate],
                    backgroundColor: ["#0071E3", "#ECECF0"],
                    borderWidth: 0,
                  },
                ],
              }}
              options={doughnutOptions}
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

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#0071E3" }} />
                <span style={{ color: "var(--text-3)" }}>Collected</span>
              </div>
              <span className="font-semibold" style={{ color: "var(--text-1)" }}>
                {collectionRate}%
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#D1D1D6" }} />
                <span style={{ color: "var(--text-3)" }}>Outstanding</span>
              </div>
              <span className="font-semibold" style={{ color: "var(--text-1)" }}>
                {100 - collectionRate}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {monthly.length > 0 ? (
        <div
          className="rounded-[32px] p-6"
          style={{ background: "rgba(255,255,255,0.74)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
        >
          <div className="mb-6">
            <h2 className="text-lg font-semibold tracking-[-0.03em]" style={{ color: "var(--text-1)" }}>
              Monthly collections
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
              Paid invoice volume over the last six months.
            </p>
          </div>

          <div className="h-[300px]">
            <Bar
              data={{
                labels: monthly.map((row) => row.month),
                datasets: [
                  {
                    data: monthly.map((row) => row.collected),
                    backgroundColor: "rgba(0,113,227,0.18)",
                    borderColor: "#0071E3",
                    borderWidth: 2,
                    borderRadius: 10,
                    borderSkipped: false,
                  },
                ],
              }}
              options={barOptions}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
