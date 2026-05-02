import Link from "next/link";
import { Check, Crown, LockKeyhole, Sparkles } from "lucide-react";
import {
  FEATURE_LABELS,
  PLAN_FEATURES,
  PLAN_NAMES,
  PLAN_ORDER,
  PLAN_PRICING,
  canAccess,
  formatFeatureValue,
  getPlanRank,
  normalizePlan,
  type PlanKey,
} from "@/lib/plan-features";
import { getDefaultOrganizationProfile } from "@/lib/organization-profile";

const FEATURE_ORDER = [
  "customer_limit",
  "ai_briefing",
  "cash_forecast",
  "health_score",
  "whatsapp_messages_per_day",
  "inventory",
  "expense_tracking",
  "invoice_generator",
  "multi_user",
  "api_access",
  "tally_sync",
  "bank_sync",
  "white_label",
];

const PLAN_STYLES: Record<PlanKey, { label: string; border: string; soft: string; icon: string }> = {
  starter: {
    label: "Essential controls for a lean finance desk.",
    border: "rgba(148, 163, 184, 0.26)",
    soft: "rgba(148, 163, 184, 0.10)",
    icon: "var(--text-muted)",
  },
  pro: {
    label: "Full operating intelligence for growing teams.",
    border: "rgba(79, 140, 255, 0.42)",
    soft: "rgba(79, 140, 255, 0.14)",
    icon: "var(--brand-primary)",
  },
  enterprise: {
    label: "Controls, integrations, and branding for scale.",
    border: "rgba(168, 85, 247, 0.40)",
    soft: "rgba(168, 85, 247, 0.14)",
    icon: "#A855F7",
  },
};

function priceLabel(plan: PlanKey) {
  const pricing = PLAN_PRICING[plan];
  if (plan === "starter") return "Free";
  if (plan === "enterprise") return "Custom";
  return `₹${pricing.monthly.toLocaleString("en-IN")}/month`;
}

function annualLabel(plan: PlanKey) {
  const annual = PLAN_PRICING[plan].annual;
  if (!annual) return plan === "enterprise" ? "Annual contracts available" : "No annual plan";
  return `₹${annual.toLocaleString("en-IN")}/year`;
}

function ctaLabel(plan: PlanKey, currentPlan: PlanKey) {
  if (plan === currentPlan) return "Current Plan";
  return getPlanRank(plan) > getPlanRank(currentPlan) ? "Upgrade" : "Switch";
}

function PlanCard({ plan, currentPlan }: { plan: PlanKey; currentPlan: PlanKey }) {
  const style = PLAN_STYLES[plan];
  const isCurrent = plan === currentPlan;
  const isUpgrade = getPlanRank(plan) > getPlanRank(currentPlan);
  const cta = ctaLabel(plan, currentPlan);
  const Icon = plan === "pro" ? Sparkles : plan === "enterprise" ? Crown : Check;
  const features = PLAN_FEATURES[plan] as Record<string, boolean | number | string | undefined>;

  return (
    <article
      className="relative rounded-lg p-5"
      style={{ background: `linear-gradient(180deg, ${style.soft}, var(--surface-0) 42%)`, border: `1px solid ${style.border}` }}
    >
      {plan === "pro" && (
        <div className="absolute -top-3 left-5 rounded-full px-3 py-1 text-[10px] font-bold uppercase text-white"
          style={{ background: "var(--brand-primary)", boxShadow: "0 12px 28px var(--brand-glow)" }}>
          Most Popular
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: style.soft, color: style.icon }}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{PLAN_NAMES[plan]}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-tertiary)]">{style.label}</p>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-3xl font-semibold tabular-nums text-[var(--text-primary)]">{priceLabel(plan)}</p>
        <p className="mt-1 text-xs font-medium text-[var(--text-muted)]">{annualLabel(plan)}</p>
      </div>

      {isCurrent ? (
        <button
          type="button"
          disabled
          className="mt-6 inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold opacity-60"
          style={{ background: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
        >
          {cta}
        </button>
      ) : (
        <Link
          href={`mailto:sales@vantro.ai?subject=${encodeURIComponent(`${cta} to ${PLAN_NAMES[plan]}`)}`}
          className="magnetic mt-6 inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          style={{
            background: isUpgrade ? "var(--brand-primary)" : "var(--surface-3)",
            boxShadow: isUpgrade ? "0 14px 34px var(--brand-glow)" : undefined,
          }}
        >
          {cta}
        </Link>
      )}

      <div className="mt-6 space-y-3">
        {FEATURE_ORDER.map((feature) => {
          const access = canAccess(plan, feature);
          const value = features[feature];
          return (
            <div key={feature} className="flex items-start gap-3">
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: access ? style.soft : "var(--surface-2)",
                  color: access ? style.icon : "var(--text-muted)",
                }}
              >
                {access ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <LockKeyhole className="h-3 w-3" aria-hidden="true" />}
              </span>
              <span className={access ? "text-sm text-[var(--text-secondary)]" : "text-sm text-[var(--text-muted)]"}>
                <span className="block font-medium">{FEATURE_LABELS[feature]}</span>
                <span className="mono text-[11px]">{formatFeatureValue(feature, value)}</span>
              </span>
            </div>
          );
        })}
      </div>
    </article>
  );
}

export default async function PlanSettingsPage() {
  const profile = await getDefaultOrganizationProfile().catch(() => null);
  const currentPlan = normalizePlan(profile?.plan);

  return (
    <main style={{ background: "var(--background)", minHeight: "100vh" }}>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <section className="vf-command-surface rounded-lg p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="apple-eyebrow mb-2">Plan & subscription</p>
              <h1 className="text-4xl font-semibold text-[var(--text-primary)] sm:text-5xl">
                Choose the operating layer your finance team needs.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-tertiary)]">
                Your workspace is currently on {PLAN_NAMES[currentPlan]}. Starter stays calm and focused; Pro unlocks the full financial intelligence layer.
              </p>
            </div>
            <div className="rounded-lg px-4 py-3" style={{ background: "var(--surface-0)", border: "1px solid var(--border-subtle)" }}>
              <p className="apple-eyebrow mb-1">Current plan</p>
              <p className="text-2xl font-semibold text-[var(--text-primary)]">{PLAN_NAMES[currentPlan]}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3" aria-label="Subscription plans">
          {PLAN_ORDER.map((plan) => (
            <PlanCard key={plan} plan={plan} currentPlan={currentPlan} />
          ))}
        </section>
      </div>
    </main>
  );
}
