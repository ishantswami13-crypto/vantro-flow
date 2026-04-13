"use client";

import dynamic from "next/dynamic";

const DashboardChart = dynamic(() => import("./DashboardChart"), { ssr: false });

interface Props {
  chartData: number[];
  chartLabels: string[];
}

export default function DashboardChartWrapper(props: Props) {
  return <DashboardChart {...props} />;
}
