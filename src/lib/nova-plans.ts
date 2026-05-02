export type Plan = 'starter' | 'pro' | 'business'

export const PLAN_CONFIG = {
  starter: {
    name: 'Starter',
    price: 0,
    priceLabel: 'Free forever',
    color: 'gray' as const,
    limits: {
      customers: 5,
      whatsapp_per_day: 1,
      inventory_skus: 0,
    },
    features: {
      collections_dashboard: true,
      basic_health_score: true,
      manual_payment_log: true,
      nova_ai_full: false,
      cash_forecast: false,
      health_score_tips: false,
      expense_tracking: false,
      invoice_generator: false,
      inventory: false,
      anomaly_detection: false,
      weekly_digest: false,
      multi_user: false,
      api_access: false,
      tally_sync: false,
      bank_sync: false,
    },
  },
  pro: {
    name: 'Pro',
    price: 2999,
    priceLabel: '₹2,999/month',
    color: 'blue' as const,
    limits: {
      customers: Infinity,
      whatsapp_per_day: Infinity,
      inventory_skus: 100,
    },
    features: {
      collections_dashboard: true,
      basic_health_score: true,
      manual_payment_log: true,
      nova_ai_full: true,
      cash_forecast: true,
      health_score_tips: true,
      expense_tracking: true,
      invoice_generator: true,
      inventory: true,
      anomaly_detection: true,
      weekly_digest: true,
      multi_user: false,
      api_access: false,
      tally_sync: false,
      bank_sync: false,
    },
  },
  business: {
    name: 'Business',
    price: 7999,
    priceLabel: '₹7,999/month',
    color: 'purple' as const,
    limits: {
      customers: Infinity,
      whatsapp_per_day: Infinity,
      inventory_skus: Infinity,
    },
    features: {
      collections_dashboard: true,
      basic_health_score: true,
      manual_payment_log: true,
      nova_ai_full: true,
      cash_forecast: true,
      health_score_tips: true,
      expense_tracking: true,
      invoice_generator: true,
      inventory: true,
      anomaly_detection: true,
      weekly_digest: true,
      multi_user: true,
      api_access: true,
      tally_sync: true,
      bank_sync: true,
    },
  },
} as const

type FeatureKey = keyof typeof PLAN_CONFIG.starter.features
type LimitKey = keyof typeof PLAN_CONFIG.starter.limits

export function normalizeNovaPlan(plan: string | null | undefined): Plan {
  if (plan === 'pro') return 'pro'
  if (plan === 'business' || plan === 'enterprise') return 'business'
  return 'starter'
}

export function canUse(plan: Plan, feature: FeatureKey): boolean {
  return PLAN_CONFIG[plan].features[feature]
}

export function getLimit(plan: Plan, limit: LimitKey): number {
  return PLAN_CONFIG[plan].limits[limit]
}

export function getUpgradePrompt(feature: FeatureKey): {
  headline: string
  detail: string
  cta: string
} {
  const prompts: Partial<Record<FeatureKey, { headline: string; detail: string; cta: string }>> = {
    nova_ai_full: {
      headline: 'Nova AI is a Pro feature',
      detail: 'Upgrade to let Nova analyze your real business data every morning and tell you exactly who to call, what to say, and when your cash gets dangerous.',
      cta: 'Unlock Nova AI — ₹2,999/mo',
    },
    cash_forecast: {
      headline: 'See your next 90 days of cash',
      detail: 'Nova predicts your cash position 30, 60, and 90 days out — so you know about danger before it arrives.',
      cta: 'Unlock Cash Forecast',
    },
    health_score_tips: {
      headline: 'Nova has 3 improvements ready for you',
      detail: 'Your score is calculated. Nova knows exactly what to fix. Upgrade Pro to see the specific actions.',
      cta: 'See Improvement Tips',
    },
    expense_tracking: {
      headline: 'Track every rupee going out',
      detail: 'See all your payables in one place. Never miss a vendor payment. Know your exact cost base.',
      cta: 'Unlock Expense Tracking',
    },
    invoice_generator: {
      headline: 'Create GST invoices in 30 seconds',
      detail: 'Generate professional GST-compliant PDFs and send them directly from Vantro.',
      cta: 'Unlock Invoice Generator',
    },
    inventory: {
      headline: 'See your stock in real time',
      detail: 'Nova monitors dead stock, low stock, and inventory value — so your money never sits idle.',
      cta: 'Unlock Inventory Intelligence',
    },
  }

  return prompts[feature] ?? {
    headline: 'This feature is on Pro',
    detail: 'Upgrade to Pro for full access to all Nova AI features.',
    cta: 'Upgrade to Pro — ₹2,999/mo',
  }
}
