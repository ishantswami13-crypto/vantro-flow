"use client";

import { startTransition, useEffect, useState } from "react";

type AnalyticsPayload = {
  totalOutstanding: number;
  collectionRate: number;
  invoiceCount: number;
  aging: {
    current: number;
    d1to30: number;
    d31to60: number;
    d60plus: number;
  };
  topCustomers: Array<{
    name: string;
    outstanding: number;
  }>;
};

function formatCurrency(value: number) {
  return `Rs ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value || 0)}`;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAnalytics() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/analytics", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error ?? "Failed to load analytics");
        }

        const payload = (await response.json()) as AnalyticsPayload;
        startTransition(() => {
          setData(payload);
        });
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(fetchError instanceof Error ? fetchError.message : "Failed to load analytics");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadAnalytics();

    return () => controller.abort();
  }, []);

  const agingRows = data
    ? [
        { label: "Current", value: data.aging.current, tone: "#0A8F84" },
        { label: "1-30 days", value: data.aging.d1to30, tone: "#2D8B4E" },
        { label: "31-60 days", value: data.aging.d31to60, tone: "#C4841D" },
        { label: "60+ days", value: data.aging.d60plus, tone: "#D64045" },
      ]
    : [];
  const maxAgingValue = Math.max(...agingRows.map((row) => row.value), 1);

  return (
    <main className="min-h-screen" style={{ background: "var(--off-white)" }}>
      <div className="mx-auto max-w-[1320px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section
          className="overflow-hidden rounded-[32px] border px-6 py-7 sm:px-8 sm:py-9"
          style={{
            borderColor: "rgba(26, 26, 26, 0.08)",
            background:
              "linear-gradient(145deg, rgba(255,255,255,0.94) 0%, rgba(242,240,235,0.95) 45%, rgba(253,243,228,0.88) 100%)",
            boxShadow: "0 18px 48px rgba(26, 26, 26, 0.05)",
          }}
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-end">
            <div>
              <p className="apple-eyebrow">Portfolio Analytics</p>
              <h1
                className="mt-3 max-w-3xl text-[3rem] leading-[0.92] sm:text-[4rem]"
                style={{ fontFamily: "var(--font-heading)", color: "var(--ink)" }}
              >
                Receivables intelligence, without the redirect.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 sm:text-[1rem]" style={{ color: "var(--ink-light)" }}>
                This page now stays on `/analytics`, fetches its own API payload on the client, and renders a dedicated
                collections summary for Vercel deployments.
              </p>
            </div>

            <div className="grid gap-4 border-t pt-5 sm:grid-cols-3 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0" style={{ borderColor: "rgba(26, 26, 26, 0.08)" }}>
              {[
                { label: "Outstanding", value: data ? formatCurrency(data.totalOutstanding) : "Loading" },
                { label: "Collection rate", value: data ? `${data.collectionRate}%` : "Loading" },
                { label: "Invoices", value: data ? data.invoiceCount.toString() : "Loading" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--ink-muted)" }}>
                    {item.label}
                  </div>
                  <div className="mt-2 text-lg font-semibold tracking-[-0.04em]" style={{ color: "var(--ink)" }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="rounded-[28px] border bg-white px-5 py-5 shadow-[0_10px_30px_rgba(26,26,26,0.04)] sm:px-6" style={{ borderColor: "var(--border)" }}>
            <p className="apple-eyebrow">Aging</p>
            <h2 className="mt-2 text-[2rem] leading-none sm:text-[2.4rem]" style={{ fontFamily: "var(--font-heading)" }}>
              CSS-only aging ladder
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6" style={{ color: "var(--ink-light)" }}>
              Each band is drawn with plain divs, scaled against the largest aging bucket returned by `/api/analytics`.
            </p>

            <div className="mt-8">
              {loading ? (
                <div className="space-y-4">
                  {[0, 1, 2, 3].map((row) => (
                    <div key={row} className="shimmer h-14 rounded-[18px]" />
                  ))}
                </div>
              ) : error ? (
                <div className="rounded-[22px] border px-5 py-6" style={{ borderColor: "rgba(214,64,69,0.18)", background: "var(--coral-wash)" }}>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--coral)" }}>
                    Unable to load analytics
                  </p>
                  <p className="mt-2 text-sm leading-6" style={{ color: "var(--ink-light)" }}>
                    {error}
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {agingRows.map((row) => {
                    const width = Math.max((row.value / maxAgingValue) * 100, row.value > 0 ? 6 : 0);

                    return (
                      <div key={row.label}>
                        <div className="mb-2 flex items-center justify-between gap-4">
                          <div className="text-sm font-semibold tracking-[-0.02em]" style={{ color: "var(--ink)" }}>
                            {row.label}
                          </div>
                          <div className="text-sm" style={{ color: "var(--ink-light)" }}>
                            {formatCurrency(row.value)}
                          </div>
                        </div>
                        <div className="h-3 rounded-full" style={{ background: "var(--cream)" }}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${width}%`,
                              background: `linear-gradient(90deg, ${row.tone} 0%, ${row.tone}CC 100%)`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border bg-white px-5 py-5 shadow-[0_10px_30px_rgba(26,26,26,0.04)] sm:px-6" style={{ borderColor: "var(--border)" }}>
            <p className="apple-eyebrow">Concentration</p>
            <h2 className="mt-2 text-[2rem] leading-none sm:text-[2.4rem]" style={{ fontFamily: "var(--font-heading)" }}>
              Top five customers
            </h2>
            <p className="mt-3 text-sm leading-6" style={{ color: "var(--ink-light)" }}>
              The highest unpaid balances in the current book, sorted from largest to smallest.
            </p>

            <div className="mt-8">
              {loading ? (
                <div className="space-y-4">
                  {[0, 1, 2, 3, 4].map((row) => (
                    <div key={row} className="shimmer h-16 rounded-[18px]" />
                  ))}
                </div>
              ) : error ? (
                <div className="rounded-[22px] border px-5 py-6" style={{ borderColor: "rgba(214,64,69,0.18)", background: "var(--coral-wash)" }}>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--coral)" }}>
                    Unable to rank customers
                  </p>
                  <p className="mt-2 text-sm leading-6" style={{ color: "var(--ink-light)" }}>
                    {error}
                  </p>
                </div>
              ) : !data || data.topCustomers.length === 0 ? (
                <div className="rounded-[22px] border px-5 py-12 text-center" style={{ borderColor: "var(--border)", background: "var(--cream)" }}>
                  <h3 className="text-[2rem] leading-none" style={{ fontFamily: "var(--font-heading)" }}>
                    No open balances right now.
                  </h3>
                  <p className="mt-3 text-sm leading-6" style={{ color: "var(--ink-light)" }}>
                    When invoices remain unpaid, the highest exposures will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.topCustomers.map((customer, index) => (
                    <div
                      key={`${customer.name}-${index}`}
                      className="flex items-center justify-between gap-4 rounded-[20px] border px-4 py-4"
                      style={{ borderColor: "var(--border)", background: index === 0 ? "rgba(10,143,132,0.04)" : "white" }}
                    >
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--ink-muted)" }}>
                          Rank {index + 1}
                        </div>
                        <div className="mt-1 truncate text-base font-semibold tracking-[-0.03em]" style={{ color: "var(--ink)" }}>
                          {customer.name}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--ink-muted)" }}>
                          Outstanding
                        </div>
                        <div className="mt-1 text-sm font-semibold tracking-[-0.02em]" style={{ color: "var(--ink)" }}>
                          {formatCurrency(customer.outstanding)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
