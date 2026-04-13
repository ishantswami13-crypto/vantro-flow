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
const BUCKET_COLORS = ["#0A8F84", "#D97706", "#F97316", "#E5354A"];

function formatCurrency(value: number | string) {
  const numericValue = typeof value === "string" ? Number.parseFloat(value) : value;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(numericValue);
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
        borderColor: "#E5E5E7",
        borderWidth: 1,
        titleColor: "#6B6B6F",
        bodyColor: "#0A0A0B",
        callbacks: {
          label: (context) => ` ${formatCurrency(context.parsed.y ?? 0)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#ADADB0" },
        border: { display: false },
      },
      y: {
        grid: { color: "rgba(0,0,0,0.04)" },
        ticks: {
          color: "#ADADB0",
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
          className="xl:col-span-2 rounded-[28px] p-6"
          style={{ background: "white", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold" style={{ color: "var(--text-1)" }}>
                Aging distribution
              </h2>
              <p className="mt-1 text-xs" style={{ color: "var(--text-3)" }}>
                Coral highlights the 60+ day risk bucket.
              </p>
            </div>
          </div>

          <div className="h-[320px]">
            <Bar
              data={{
                labels: BUCKET_ORDER.map((bucket) => BUCKET_LABELS[bucket]),
                datasets: [
                  {
                    data: agingValues,
                    backgroundColor: BUCKET_COLORS.map((color) => `${color}26`),
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
          className="rounded-[28px] p-6"
          style={{ background: "white", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}
        >
          <h2 className="text-lg font-bold" style={{ color: "var(--text-1)" }}>
            Collection rate
          </h2>
          <p className="mt-1 text-xs" style={{ color: "var(--text-3)" }}>
            Paid invoices versus pending inventory.
          </p>

          <div className="relative mt-6 h-[240px]">
            <Doughnut
              data={{
                labels: ["Collected", "Outstanding"],
                datasets: [
                  {
                    data: [collectionRate, 100 - collectionRate],
                    backgroundColor: ["#0A8F84", "#F3F4F6"],
                    borderWidth: 0,
                  },
                ],
              }}
              options={doughnutOptions}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold" style={{ color: "var(--teal)", fontFamily: "var(--font-syne, 'Bricolage Grotesque')" }}>
                {collectionRate}%
              </span>
              <span className="text-xs" style={{ color: "var(--text-3)" }}>
                collected
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#0A8F84" }} />
                <span style={{ color: "var(--text-3)" }}>Collected</span>
              </div>
              <span className="font-semibold" style={{ color: "var(--text-1)" }}>
                {collectionRate}%
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#E5E7EB" }} />
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
          className="rounded-[28px] p-6"
          style={{ background: "white", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}
        >
          <div className="mb-6">
            <h2 className="text-lg font-bold" style={{ color: "var(--text-1)" }}>
              Monthly collections
            </h2>
            <p className="mt-1 text-xs" style={{ color: "var(--text-3)" }}>
              Last 6 months of paid invoice volume.
            </p>
          </div>

          <div className="h-[300px]">
            <Bar
              data={{
                labels: monthly.map((row) => row.month),
                datasets: [
                  {
                    data: monthly.map((row) => row.collected),
                    backgroundColor: "rgba(10,143,132,0.18)",
                    borderColor: "#0A8F84",
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
