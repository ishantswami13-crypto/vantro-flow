"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  COMPANY_SCALES,
  FEATURE_MODULES,
  type CompanyScale,
  type FeatureModuleId,
  getRecommendedModules,
} from "@/lib/onboarding-config";
import type { OrganizationProfile } from "@/lib/organization-profile";

interface Props {
  initialProfile: OrganizationProfile;
}

interface FormState {
  name: string;
  contactName: string;
  email: string;
  businessType: string;
  city: string;
  state: string;
  companyScale: CompanyScale;
  selectedModules: FeatureModuleId[];
}

function createInitialForm(profile: OrganizationProfile): FormState {
  const fallbackScale = profile.companyScale ?? "small_scale";

  return {
    name: profile.name === "Vantro Workspace" ? "" : profile.name,
    contactName: profile.contactName ?? "",
    email: profile.email ?? "",
    businessType: profile.businessType ?? "",
    city: profile.city ?? "",
    state: profile.state ?? "",
    companyScale: fallbackScale,
    selectedModules:
      profile.selectedModules.length > 0 ? profile.selectedModules : getRecommendedModules(fallbackScale),
  };
}

export default function WelcomeFlow({ initialProfile }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => createInitialForm(initialProfile));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recommendedModules = useMemo(
    () => new Set(getRecommendedModules(form.companyScale)),
    [form.companyScale]
  );

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setError(null);
  }

  function handleScaleSelect(scale: CompanyScale) {
    setForm((current) => ({
      ...current,
      companyScale: scale,
      selectedModules: Array.from(new Set([...getRecommendedModules(scale), ...current.selectedModules])),
    }));
    setError(null);
  }

  function toggleModule(moduleId: FeatureModuleId) {
    setForm((current) => {
      const exists = current.selectedModules.includes(moduleId);
      return {
        ...current,
        selectedModules: exists
          ? current.selectedModules.filter((item) => item !== moduleId)
          : [...current.selectedModules, moduleId],
      };
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim() || !form.contactName.trim() || !form.email.trim()) {
      setError("Company name, contact name, and email are required.");
      return;
    }

    if (form.selectedModules.length === 0) {
      setError("Choose at least one workflow to turn on.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Failed to save onboarding.");
      }

      router.push("/");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save onboarding.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-[1320px] gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="linear-panel flex flex-col rounded-[24px] p-6"
          >
            <div>
              <div className="linear-tag">Workspace setup</div>
              <p className="apple-eyebrow mt-8">Vantro Flow</p>
              <h1 className="mt-3 text-[2rem] font-semibold leading-[1.02] tracking-[-0.05em]">
                Configure the workspace around your collections motion.
              </h1>
              <p className="mt-4 text-sm leading-6" style={{ color: "var(--text-3)" }}>
                Pick the operating scale first. That preset controls which workflows are turned on by default.
              </p>
            </div>

            <div className="mt-8 space-y-3">
              {COMPANY_SCALES.map((scale, index) => {
                const active = form.companyScale === scale.id;

                return (
                  <motion.button
                    key={scale.id}
                    type="button"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + index * 0.04 }}
                    onClick={() => handleScaleSelect(scale.id)}
                    className="w-full rounded-[16px] px-4 py-4 text-left transition-colors"
                    style={{
                      background: active ? "rgba(94,106,210,0.08)" : "var(--bg-surface)",
                      border: active ? "1px solid rgba(94,106,210,0.16)" : "1px solid var(--border)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold tracking-[-0.02em]">{scale.label}</div>
                        <div className="mt-1 text-xs leading-5" style={{ color: "var(--text-3)" }}>
                          {scale.description}
                        </div>
                      </div>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]"
                        style={{
                          background: active ? "var(--accent)" : "var(--bg-surface-2)",
                          color: active ? "#fff" : "var(--text-4)",
                        }}
                      >
                        {active ? "Active" : "Preset"}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <div className="mt-auto rounded-[18px] bg-[var(--bg-surface-2)] px-4 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-4)" }}>
                Outcome
              </div>
              <div className="mt-2 text-sm font-medium tracking-[-0.02em]" style={{ color: "var(--text-1)" }}>
                Your first dashboard will only show the modules your team selected.
              </div>
            </div>
          </motion.aside>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="linear-panel rounded-[24px] p-6 sm:p-7"
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <p className="apple-eyebrow">Registration</p>
                  <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.05em] sm:text-[2.4rem]">
                    Create the first workspace.
                  </h2>
                  <p className="mt-3 text-sm leading-6" style={{ color: "var(--text-3)" }}>
                    This is organization-level setup. Real per-user auth can sit on top of this later without changing the product model.
                  </p>
                </div>
                <div className="linear-tag">
                  {COMPANY_SCALES.find((entry) => entry.id === form.companyScale)?.label}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  { key: "name", label: "Company name *", placeholder: "Apex Distribution Pvt Ltd" },
                  { key: "contactName", label: "Contact name *", placeholder: "Ishant Mehta" },
                  { key: "email", label: "Work email *", placeholder: "finance@apex.in" },
                  { key: "businessType", label: "Business type", placeholder: "Distributor, manufacturer, exporter" },
                  { key: "city", label: "City", placeholder: "Delhi" },
                  { key: "state", label: "State", placeholder: "Delhi" },
                ].map((field) => (
                  <label key={field.key} className="block">
                    <span className="mb-1.5 block text-xs font-medium" style={{ color: "var(--text-3)" }}>
                      {field.label}
                    </span>
                    <input
                      value={form[field.key as keyof FormState] as string}
                      onChange={(event) =>
                        updateField(field.key as keyof FormState, event.target.value as FormState[keyof FormState])
                      }
                      placeholder={field.placeholder}
                      className="apple-input px-4 py-3 text-sm"
                    />
                  </label>
                ))}
              </div>

              <div className="rounded-[18px] border px-4 py-4" style={{ borderColor: "var(--border)", background: "var(--bg-surface-2)" }}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold tracking-[-0.02em]">Workflow modules</p>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-3)" }}>
                      Recommended modules are pre-selected from your scale. Add or remove anything before continuing.
                    </p>
                  </div>
                  <div className="text-xs font-medium" style={{ color: "var(--text-4)" }}>
                    {form.selectedModules.length} selected
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {FEATURE_MODULES.map((module) => {
                  const active = form.selectedModules.includes(module.id);
                  const recommended = recommendedModules.has(module.id);

                  return (
                    <button
                      key={module.id}
                      type="button"
                      onClick={() => toggleModule(module.id)}
                      className="rounded-[18px] px-4 py-4 text-left transition-colors"
                      style={{
                        background: active ? "rgba(94,106,210,0.08)" : "var(--bg-surface)",
                        border: active ? "1px solid rgba(94,106,210,0.16)" : "1px solid var(--border)",
                        boxShadow: active ? "var(--shadow-sm)" : "none",
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold tracking-[-0.02em]" style={{ color: "var(--text-1)" }}>
                            {module.label}
                          </div>
                          <div className="mt-1 text-xs leading-5" style={{ color: "var(--text-3)" }}>
                            {module.description}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {recommended ? (
                            <span className="linear-tag">Recommended</span>
                          ) : null}
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]"
                            style={{
                              background: active ? "var(--accent)" : "var(--bg-surface-2)",
                              color: active ? "#fff" : "var(--text-4)",
                            }}
                          >
                            {active ? "On" : "Off"}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {error ? (
                <div
                  className="rounded-[16px] px-4 py-3 text-sm"
                  style={{ background: "var(--danger-soft)", border: "1px solid rgba(194,75,96,0.14)", color: "var(--danger)" }}
                >
                  {error}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--border)" }}>
                <p className="max-w-xl text-xs leading-5" style={{ color: "var(--text-4)" }}>
                  The workspace should feel immediately useful. This setup reduces noise by showing only the workflows that match how your team actually collects.
                </p>
                <button
                  type="submit"
                  disabled={loading}
                  className="apple-button apple-button-primary px-5 py-3 text-sm font-semibold"
                  style={{ opacity: loading ? 0.75 : 1 }}
                >
                  {loading ? "Saving setup..." : "Enter workspace"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
