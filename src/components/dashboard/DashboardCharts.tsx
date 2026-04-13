"use client";

import { motion } from "framer-motion";
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
    <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="xl:col-span-2 rounded-[28px] p-6"
        style={{ background: "white", boxShadow: "var(--shadow-md)", border: "1px solid var(--border)" }}
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-1)" }}>
              Collections Trend
            </h2>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>
              Outstanding amount over the last 7 days
            </p>
          </div>
          <div className="flex gap-2">
            {["7D", "30D", "90D"].map((period) => (
              <button
                key={period}
                className="rounded-lg px-3 py-1 text-xs font-medium"
                style={{
                  background: period === "7D" ? "var(--teal-light)" : "var(--bg-surface-2)",
                  color: period === "7D" ? "var(--teal)" : "var(--text-3)",
                }}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[320px]">
          <Line
            data={{
              labels: data.last7Days.map((item) => shortDateLabel(item.date)),
              datasets: [
                {
                  data: data.last7Days.map((item) => item.amount),
                  borderColor: "#0A8F84",
                  backgroundColor: (context) => {
                    const gradient = context.chart.ctx.createLinearGradient(0, 0, 0, 220);
                    gradient.addColorStop(0, "rgba(10,143,132,0.18)");
                    gradient.addColorStop(1, "rgba(10,143,132,0)");
                    return gradient;
                  },
                  fill: true,
                  tension: 0.4,
                  pointBackgroundColor: "#FFFFFF",
                  pointBorderColor: "#0A8F84",
                  pointBorderWidth: 2,
                  pointRadius: 5,
                  pointHoverRadius: 7,
                  borderWidth: 2.5,
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
                  borderColor: "#E5E5E7",
                  borderWidth: 1,
                  titleColor: "#6B6B6F",
                  bodyColor: "#0A0A0B",
                  bodyFont: { family: "DM Sans", weight: 600, size: 14 },
                  padding: 12,
                  cornerRadius: 12,
                  callbacks: {
                    label: (context) =>
                      `₹${formatIndian(typeof context.raw === "number" ? context.raw : Number(context.raw ?? 0))}`,
                  },
                },
              },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: {
                    color: "#ADADB0",
                    font: { family: "DM Sans", size: 11 },
                  },
                },
                y: {
                  grid: { color: "rgba(0,0,0,0.04)" },
                  ticks: {
                    color: "#ADADB0",
                    font: { family: "DM Sans", size: 11 },
                    callback: (value) => `₹${(Number(value) / 100000).toFixed(1)}L`,
                  },
                  border: { dash: [4, 4] },
                },
              },
              animation: { duration: 1200, easing: "easeInOutQuart" },
            }}
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-[28px] p-6"
        style={{ background: "white", boxShadow: "var(--shadow-md)", border: "1px solid var(--border)" }}
      >
        <h2 className="mb-1 text-lg font-bold" style={{ color: "var(--text-1)" }}>
          Collection Rate
        </h2>
        <p className="mb-6 text-xs" style={{ color: "var(--text-3)" }}>
          Paid vs pending
        </p>

        <div className="relative mb-4 flex items-center justify-center">
          <div className="h-[220px] w-[220px]">
            <Doughnut
              data={{
                labels: ["Paid", "Pending"],
                datasets: [
                  {
                    data: [data.collectionRate || 0, 100 - (data.collectionRate || 0)],
                    backgroundColor: ["#0A8F84", "#F5F5F7"],
                    borderWidth: 0,
                    hoverOffset: 4,
                  },
                ],
              }}
              options={{
                maintainAspectRatio: false,
                cutout: "75%",
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                animation: { duration: 1500, easing: "easeInOutQuart" },
              }}
            />
          </div>
          <div className="absolute text-center">
            <div className="text-3xl font-bold" style={{ color: "var(--teal)" }}>
              {data.collectionRate}%
            </div>
            <div className="text-xs" style={{ color: "var(--text-3)" }}>
              Collected
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {[
            { label: "Paid", color: "#0A8F84", value: data.collectionRate },
            { label: "Pending", color: "#EFEFEF", value: 100 - (data.collectionRate || 0) },
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
      </motion.div>
    </div>
  );
}
