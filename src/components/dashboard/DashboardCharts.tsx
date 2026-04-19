"use client";

import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import type { DashboardPayload } from "./types";
import { formatIndian, shortDateLabel } from "./utils";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Filler, Tooltip, Legend);

interface Props {
  data: DashboardPayload;
}

export default function DashboardCharts({ data }: Props) {
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
            <span className="linear-tag">Auto</span>
          </div>
        </div>

        <div className="h-[300px]">
          <Line
            data={{
              labels: data.last7Days.map((item) => shortDateLabel(item.date)),
              datasets: [
                {
                  data: data.last7Days.map((item) => item.amount),
                  borderColor: "#5E6AD2",
                  backgroundColor: (context) => {
                    const gradient = context.chart.ctx.createLinearGradient(0, 0, 0, 220);
                    gradient.addColorStop(0, "rgba(94,106,210,0.16)");
                    gradient.addColorStop(1, "rgba(94,106,210,0)");
                    return gradient;
                  },
                  fill: true,
                  tension: 0.32,
                  pointBackgroundColor: "#ffffff",
                  pointBorderColor: "#5E6AD2",
                  pointBorderWidth: 2,
                  pointRadius: 3.5,
                  pointHoverRadius: 5,
                  borderWidth: 2.2,
                },
              ],
            }}
            options={{
              maintainAspectRatio: false,
              responsive: true,
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: "white",
                  borderColor: "rgba(16,24,40,0.08)",
                  borderWidth: 1,
                  titleColor: "#667085",
                  bodyColor: "#101828",
                  bodyFont: { family: "system-ui", weight: 600, size: 13 },
                  padding: 10,
                  cornerRadius: 10,
                  callbacks: {
                    label: (context) =>
                      `INR ${formatIndian(typeof context.raw === "number" ? context.raw : Number(context.raw ?? 0))}`,
                  },
                },
              },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: { color: "#98A2B3", font: { family: "system-ui", size: 11 } },
                },
                y: {
                  grid: { color: "rgba(16,24,40,0.05)" },
                  ticks: {
                    color: "#98A2B3",
                    font: { family: "system-ui", size: 11 },
                    callback: (value) => `INR ${(Number(value) / 100000).toFixed(1)}L`,
                  },
                  border: { display: false },
                },
              },
              animation: { duration: 900, easing: "easeInOutQuart" },
            }}
          />
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
          <div className="h-[210px] w-[210px]">
            <Doughnut
              data={{
                labels: ["Paid", "Pending"],
                datasets: [
                  {
                    data: [data.collectionRate || 0, 100 - (data.collectionRate || 0)],
                    backgroundColor: ["#5E6AD2", "#ECEEF3"],
                    borderWidth: 0,
                    hoverOffset: 0,
                  },
                ],
              }}
              options={{
                maintainAspectRatio: false,
                cutout: "78%",
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                animation: { duration: 900, easing: "easeInOutQuart" },
              }}
            />
          </div>
          <div className="absolute text-center">
            <div className="text-4xl font-semibold tracking-[-0.05em]" style={{ color: "var(--accent)" }}>
              {data.collectionRate}%
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-4)" }}>
              Collected
            </div>
          </div>
        </div>

        <div className="space-y-2 border-t pt-4" style={{ borderColor: "var(--border)" }}>
          {[
            { label: "Paid", color: "#5E6AD2", value: data.collectionRate },
            { label: "Pending", color: "#D0D5DD", value: 100 - (data.collectionRate || 0) },
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
