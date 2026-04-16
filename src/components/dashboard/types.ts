import type { CompanyScale, FeatureModuleId } from "@/lib/onboarding-config";

export interface DashboardPayload {
  totalOutstanding: number;
  collectedThisMonth: number;
  activeCustomers: number;
  collectionRate: number;
  organization: {
    name: string;
    companyScale: CompanyScale | null;
    selectedModules: FeatureModuleId[];
  };
  agingBuckets: {
    current: { amount: number; count: number };
    aging1to30: { amount: number; count: number };
    aging31to60: { amount: number; count: number };
    aging60plus: { amount: number; count: number };
  };
  followUpList: Array<{
    id: number;
    customerId: number;
    customerName: string;
    invoiceNumber: string;
    amount: string | number;
    amountPaid: string | number | null;
    daysOverdue: number | null;
    dueDate: string | null;
  }>;
  weekForecast: {
    expectedThisWeek: number;
    promisesDue: number;
    overdueRisk: number;
  };
  last7Days: Array<{
    date: string;
    amount: number;
  }>;
}
