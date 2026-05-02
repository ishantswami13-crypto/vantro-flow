export const PLAN_FEATURES = {
  starter: {
    customer_limit: 5,
    ai_briefing: "basic",
    cash_forecast: false,
    health_score: "view_only",
    whatsapp_messages_per_day: 1,
    inventory: false,
    expense_tracking: false,
    invoice_generator: false,
    multi_user: false,
    api_access: false,
  },
  pro: {
    customer_limit: Infinity,
    ai_briefing: "full",
    cash_forecast: true,
    health_score: "full",
    whatsapp_messages_per_day: Infinity,
    inventory: true,
    expense_tracking: true,
    invoice_generator: true,
    multi_user: false,
    api_access: false,
  },
  enterprise: {
    customer_limit: Infinity,
    ai_briefing: "full",
    cash_forecast: true,
    health_score: "full",
    whatsapp_messages_per_day: Infinity,
    inventory: true,
    expense_tracking: true,
    invoice_generator: true,
    multi_user: true,
    api_access: true,
    tally_sync: true,
    bank_sync: true,
    white_label: true,
  },
} as const;

export type PlanKey = keyof typeof PLAN_FEATURES;
export type PlanFeatureValue = boolean | number | string;

export const PLAN_ORDER: PlanKey[] = ["starter", "pro", "enterprise"];

export const PLAN_PRICING: Record<PlanKey, { monthly: number; annual: number | null }> = {
  starter: { monthly: 0, annual: 0 },
  pro: { monthly: 3499, annual: 34990 },
  enterprise: { monthly: 0, annual: null },
};

export const PLAN_NAMES: Record<PlanKey, string> = {
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

export const FEATURE_LABELS: Record<string, string> = {
  customer_limit: "Customer limit",
  ai_briefing: "AI briefing",
  cash_forecast: "Cash forecast",
  health_score: "Health score",
  whatsapp_messages_per_day: "WhatsApp reminders",
  inventory: "Inventory tracking",
  expense_tracking: "Expense tracking",
  invoice_generator: "Invoice generator",
  multi_user: "Multi-user workspace",
  api_access: "API access",
  tally_sync: "Tally sync",
  bank_sync: "Bank sync",
  white_label: "White label",
};

export const UPGRADE_FEATURE_DETAILS: Record<string, string> = {
  ai_briefing: "Full AI briefings use live business data instead of starter templates.",
  cash_forecast: "See expected inflows, outflows, and runway before cash gets tight.",
  health_score: "Unlock improvement tips, not just the score.",
  whatsapp_messages_per_day: "Remove the one-message-per-day starter cap.",
  inventory: "Track stock movement alongside cash and receivables.",
  expense_tracking: "Track outgoing payments and leakage in the same command center.",
  invoice_generator: "Create polished invoices without leaving Vantro.",
  multi_user: "Bring your finance team into one controlled workspace.",
  api_access: "Connect Vantro data to your internal systems.",
  tally_sync: "Sync accounting context directly from Tally.",
  bank_sync: "Reconcile bank movement against Vantro intelligence.",
  white_label: "Run Vantro under your own enterprise brand.",
};

export function normalizePlan(plan: string | null | undefined): PlanKey {
  const normalized = plan?.toLowerCase();

  if (normalized === "pro" || normalized === "enterprise" || normalized === "starter") {
    return normalized;
  }

  return "starter";
}

export function getPlanRank(plan: string | null | undefined) {
  return PLAN_ORDER.indexOf(normalizePlan(plan));
}

export function getFeatureValue(plan: string | null | undefined, feature: string): PlanFeatureValue | undefined {
  const features = PLAN_FEATURES[normalizePlan(plan)] as Record<string, PlanFeatureValue | undefined>;
  return features[feature];
}

export function canAccess(userPlan: string, feature: string): boolean {
  const value = getFeatureValue(userPlan, feature);

  if (value === undefined || value === null || value === false) {
    return false;
  }

  if (typeof value === "number") {
    return value > 0;
  }

  return true;
}

export function getRequiredPlanForFeature(feature: string): PlanKey {
  return PLAN_ORDER.find((plan) => canAccess(plan, feature)) ?? "enterprise";
}

export function getUpgradePlanForFeature(feature: string): PlanKey {
  const planWithFeature = getRequiredPlanForFeature(feature);
  return planWithFeature === "starter" ? "pro" : planWithFeature;
}

export function getUpgradeMessage(feature: string): string {
  const plan = PLAN_NAMES[getUpgradePlanForFeature(feature)];
  const label = FEATURE_LABELS[feature] ?? "This feature";
  const detail = UPGRADE_FEATURE_DETAILS[feature];

  return detail ? `${label} is available on ${plan}. ${detail}` : `${label} is available on ${plan}.`;
}

export function formatFeatureValue(feature: string, value: PlanFeatureValue | undefined): string {
  if (value === undefined || value === false) return "Not included";
  if (value === true) return "Included";
  if (value === Infinity) return feature === "customer_limit" ? "Unlimited customers" : "Unlimited";
  if (feature === "customer_limit") return `${value} customers`;
  if (feature === "whatsapp_messages_per_day") return `${value}/day`;
  if (value === "basic") return "Basic";
  if (value === "full") return "Full";
  if (value === "view_only") return "View only";
  return String(value);
}
