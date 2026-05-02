"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, LockKeyhole, Sparkles } from "lucide-react";
import {
  FEATURE_LABELS,
  PLAN_FEATURES,
  PLAN_NAMES,
  PLAN_PRICING,
  canAccess,
  formatFeatureValue,
  getUpgradeMessage,
  getUpgradePlanForFeature,
  normalizePlan,
} from "@/lib/plan-features";

export default function UpgradePrompt({
  feature,
  currentPlan,
}: {
  feature: string;
  currentPlan: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const normalizedPlan = normalizePlan(currentPlan);
  const targetPlan = getUpgradePlanForFeature(feature);
  const hasAccess = canAccess(normalizedPlan, feature);
  const price = PLAN_PRICING[targetPlan].monthly;
  const targetFeatures = PLAN_FEATURES[targetPlan] as Record<string, boolean | number | string | undefined>;
  const currentFeatures = PLAN_FEATURES[normalizedPlan] as Record<string, boolean | number | string | undefined>;

  const included = useMemo(() => {
    return Object.entries(targetFeatures)
      .filter(([key, value]) => value !== false && value !== undefined && currentFeatures[key] !== value)
      .slice(0, 6)
      .map(([key, value]) => ({
        key,
        label: FEATURE_LABELS[key] ?? key.replaceAll("_", " "),
        value,
      }));
  }, [currentFeatures, targetFeatures]);

  if (hasAccess) {
    return null;
  }

  return (
    <section
      className="rounded-2xl p-5 sm:p-6"
      style={{
        background: "var(--surface-0)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-xs)",
      }}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div
            className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: "var(--brand-primary-soft)", color: "var(--brand-primary)" }}
          >
            <LockKeyhole className="h-4 w-4" aria-hidden="true" />
          </div>
          <p className="apple-eyebrow mb-2">{PLAN_NAMES[normalizedPlan]} plan</p>
          <h2 className="text-2xl font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
            This feature is available on {PLAN_NAMES[targetPlan]}.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-tertiary)]">
            {getUpgradeMessage(feature)}
          </p>
        </div>

        <Link
          href="/settings/plan"
          className="magnetic inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: "var(--brand-primary)", boxShadow: "0 14px 34px var(--brand-glow)" }}
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {price > 0 ? `Upgrade for ₹${price.toLocaleString("en-IN")}/month` : "Talk to sales"}
        </Link>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
        aria-expanded={expanded}
      >
        See what&apos;s included
        {expanded ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
      </button>

      {expanded && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {included.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
              style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)" }}
            >
              <span className="text-sm font-medium text-[var(--text-secondary)]">{item.label}</span>
              <span className="mono text-xs text-[var(--text-muted)]">{formatFeatureValue(item.key, item.value)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
