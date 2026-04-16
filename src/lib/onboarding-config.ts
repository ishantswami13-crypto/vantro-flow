export const PRIMARY_ORG_ID = 1;

export const COMPANY_SCALES = [
  {
    id: "small_scale",
    label: "Small Scale",
    description: "Owner-led teams managing a focused receivables book.",
  },
  {
    id: "mnc",
    label: "MNC / Multi-Branch",
    description: "Multi-team finance operations that need structured visibility.",
  },
  {
    id: "large_scale",
    label: "Large Scale",
    description: "High-volume collections programs with layered risk and reporting.",
  },
] as const;

export const FEATURE_MODULES = [
  {
    id: "daily_followups",
    label: "Daily Follow-Ups",
    description: "Prioritized overdue queues for today's collection work.",
    scales: ["small_scale", "mnc", "large_scale"],
  },
  {
    id: "payment_reminders",
    label: "Payment Reminders",
    description: "Generate ready-to-send follow-up messages from each invoice.",
    scales: ["small_scale", "mnc", "large_scale"],
  },
  {
    id: "customer_ledgers",
    label: "Customer Ledgers",
    description: "Keep every customer profile, invoice, and note in one place.",
    scales: ["small_scale", "mnc", "large_scale"],
  },
  {
    id: "invoice_imports",
    label: "Invoice Imports",
    description: "Bring invoices in through CSV and keep onboarding lightweight.",
    scales: ["small_scale", "mnc", "large_scale"],
  },
  {
    id: "promises_tracking",
    label: "Promise Tracking",
    description: "Monitor committed payment dates and expected cash movement.",
    scales: ["mnc", "large_scale", "small_scale"],
  },
  {
    id: "portfolio_analytics",
    label: "Portfolio Analytics",
    description: "Track aging, collection rate, and concentration risk over time.",
    scales: ["mnc", "large_scale"],
  },
] as const;

export type CompanyScale = (typeof COMPANY_SCALES)[number]["id"];
export type FeatureModuleId = (typeof FEATURE_MODULES)[number]["id"];

export const DEFAULT_MODULES_BY_SCALE: Record<CompanyScale, FeatureModuleId[]> = {
  small_scale: ["daily_followups", "payment_reminders", "customer_ledgers", "invoice_imports"],
  mnc: ["daily_followups", "payment_reminders", "customer_ledgers", "promises_tracking", "portfolio_analytics"],
  large_scale: ["daily_followups", "payment_reminders", "customer_ledgers", "invoice_imports", "promises_tracking", "portfolio_analytics"],
};

export function getRecommendedModules(scale: CompanyScale): FeatureModuleId[] {
  return DEFAULT_MODULES_BY_SCALE[scale];
}

export function parseSelectedModules(rawValue: string | null | undefined): FeatureModuleId[] {
  if (!rawValue) {
    return [];
  }

  const validIds = new Set(FEATURE_MODULES.map((module) => module.id));

  return rawValue
    .split(",")
    .map((value) => value.trim())
    .filter((value): value is FeatureModuleId => validIds.has(value as FeatureModuleId));
}

export function serializeSelectedModules(modules: FeatureModuleId[]): string {
  return Array.from(new Set(modules)).join(",");
}

export function getScaleLabel(scale: CompanyScale | null | undefined) {
  return COMPANY_SCALES.find((entry) => entry.id === scale)?.label ?? "Unconfigured";
}
