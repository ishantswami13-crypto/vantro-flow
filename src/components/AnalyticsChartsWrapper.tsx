"use client";

import dynamic from "next/dynamic";

const AnalyticsCharts = dynamic(() => import("./AnalyticsCharts"), { ssr: false });

interface AgingRow { bucket: string | null; total: number; count: number; }
interface MonthlyRow { month: string; month_order: string; collected: number; count: number; }
interface TopCustomer { id: number; name: string; outstanding: number; overdue_invoices: number; }

interface Props {
  aging: AgingRow[];
  monthly: MonthlyRow[];
  topCustomers: TopCustomer[];
  collectionRate: number;
}

export default function AnalyticsChartsWrapper(props: Props) {
  return <AnalyticsCharts {...props} />;
}
