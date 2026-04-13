"use client";

import { Line } from "react-chartjs-2";
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

interface Props {
  chartData: number[];
  chartLabels: string[];
}

export default function DashboardChart({ chartData, chartLabels }: Props) {
  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(13,13,26,0.95)",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        titleColor: "#94A3B8",
        bodyColor: "#F8FAFC",
        padding: 12,
        callbacks: {
          label: (ctx) => ` ₹${new Intl.NumberFormat("en-IN").format(ctx.parsed.y ?? 0)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: { color: "#475569", font: { size: 12 } },
        border: { color: "rgba(255,255,255,0.04)" },
      },
      y: {
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: {
          color: "#475569",
          font: { size: 12 },
          callback: (value: number | string) => {
            const n = Number(value);
            if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
            if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
            return `₹${n}`;
          },
        },
        border: { color: "rgba(255,255,255,0.04)" },
      },
    },
    animation: { duration: 1000, easing: "easeInOutQuart" },
  };

  return (
    <Line
      data={{
        labels: chartLabels,
        datasets: [
          {
            data: chartData,
            borderColor: "#0D9488",
            backgroundColor: "rgba(13,148,136,0.12)",
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "#0D9488",
            pointBorderColor: "#05050F",
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            borderWidth: 2,
          },
        ],
      }}
      options={options}
    />
  );
}
