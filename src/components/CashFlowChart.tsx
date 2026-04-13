"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

interface Props {
  outstanding: number;
  overdueRisk: number;
  expectedThisWeek: number;
}

export default function CashFlowChart({ outstanding, overdueRisk, expectedThisWeek }: Props) {
  const labels: string[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    labels.push(d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }));
  }

  // Build a descending curve from outstanding toward expected resolution
  const base = Number(outstanding) || 0;
  const risk = Number(overdueRisk) || 0;
  const expected = Number(expectedThisWeek) || 0;
  const step = expected > 0 ? expected / 7 : risk * 0.05;
  const values = labels.map((_, i) => Math.max(0, base - step * i * (0.6 + i * 0.08)));

  const gradientPlugin = {
    id: "customGradient",
    beforeDatasetsDraw() {},
  };

  const data = {
    labels,
    datasets: [
      {
        data: values,
        borderColor: "#0D9488",
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: "#0D9488",
        pointBorderColor: "rgba(13,148,136,0.3)",
        pointBorderWidth: 4,
        tension: 0.4,
        fill: true,
        backgroundColor: (ctx: { chart: ChartJS }) => {
          const { ctx: canvas, chartArea } = ctx.chart;
          if (!chartArea) return "rgba(13,148,136,0.05)";
          const gradient = canvas.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, "rgba(13,148,136,0.2)");
          gradient.addColorStop(1, "rgba(13,148,136,0.0)");
          return gradient;
        },
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 1000, easing: "easeInOutQuart" },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(10,10,24,0.95)",
        borderColor: "rgba(255,255,255,0.08)",
        borderWidth: 1,
        titleColor: "#94A3B8",
        bodyColor: "#F8FAFC",
        bodyFont: { weight: "bold" as const },
        callbacks: {
          label: (ctx) =>
            " " + new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(ctx.parsed.y ?? 0),
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(255,255,255,0.04)", drawTicks: false },
        ticks: { color: "#475569", font: { size: 11 } },
        border: { display: false },
      },
      y: {
        grid: { color: "rgba(255,255,255,0.04)", drawTicks: false },
        ticks: {
          color: "#475569",
          font: { size: 11 },
          callback: (v) => "₹" + new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(Number(v)),
        },
        border: { display: false },
      },
    },
  };

  return (
    <div className="chart-container" style={{ height: 200 }}>
      <Line data={data} options={options} plugins={[gradientPlugin]} />
    </div>
  );
}
