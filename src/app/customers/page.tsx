"use client";

import Link from "next/link";
import { startTransition, useDeferredValue, useEffect, useState } from "react";

type CustomerRecord = {
  id: number;
  name: string;
  phone: string | null;
  city: string | null;
  invoiceCount: number;
  outstanding: number;
  maxDaysOverdue: number;
};

function healthDot(days: number): { color: string } {
  if (days === 0) return { color: "#2D8B4E" };   // green — current
  if (days <= 30) return { color: "#C4841D" };    // amber — 1-30d
  if (days <= 60) return { color: "#E87B35" };    // orange — 31-60d
  return { color: "#D64045" };                    // red — 60+d
}

function formatCurrency(value: number) {
  return `Rs ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value || 0)}`;
}

function formatCompactCurrency(value: number) {
  return `Rs ${new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: value >= 100000 ? 1 : 0,
  }).format(value || 0)}`;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  useEffect(() => {
    const controller = new AbortController();

    async function loadCustomers() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/customers", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error ?? "Failed to load customers");
        }

        const payload = (await response.json()) as CustomerRecord[];
        startTransition(() => {
          setCustomers(payload);
        });
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(fetchError instanceof Error ? fetchError.message : "Failed to load customers");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadCustomers();

    return () => controller.abort();
  }, []);

  const filteredCustomers = normalizedQuery
    ? customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(normalizedQuery) ||
          (customer.phone ?? "").includes(deferredQuery.trim())
      )
    : customers;

  const totalOutstanding = filteredCustomers.reduce((sum, customer) => sum + customer.outstanding, 0);
  const totalInvoices = filteredCustomers.reduce((sum, customer) => sum + customer.invoiceCount, 0);
  const maxOutstanding = Math.max(...filteredCustomers.map((customer) => customer.outstanding), 1);

  return (
    <main className="min-h-screen" style={{ background: "var(--off-white)" }}>
      <div className="mx-auto max-w-[1320px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section
          className="overflow-hidden rounded-[32px] border px-6 py-7 sm:px-8 sm:py-9"
          style={{
            borderColor: "rgba(26, 26, 26, 0.08)",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(242,240,235,0.94) 52%, rgba(232,246,244,0.78) 100%)",
            boxShadow: "0 18px 48px rgba(26, 26, 26, 0.05)",
          }}
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)] lg:items-end">
            <div>
              <p className="apple-eyebrow">Customer Ledger</p>
              <h1
                className="mt-3 max-w-3xl text-[3rem] leading-[0.92] sm:text-[4rem]"
                style={{ fontFamily: "var(--font-heading)", color: "var(--ink)" }}
              >
                A live portfolio of every open account.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 sm:text-[1rem]" style={{ color: "var(--ink-light)" }}>
                Customer balances now render from API-backed data instead of server-side redirects, so the page stays
                on `/customers` in Vercel and shows a working ledger view.
              </p>
            </div>

            <div className="grid gap-4 border-t pt-5 sm:grid-cols-3 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0" style={{ borderColor: "rgba(26, 26, 26, 0.08)" }}>
              {[
                { label: "Accounts", value: filteredCustomers.length.toString() },
                { label: "Open invoices", value: totalInvoices.toString() },
                { label: "Outstanding", value: formatCompactCurrency(totalOutstanding) },
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

        <section className="mt-6 rounded-[28px] border bg-white px-5 py-5 shadow-[0_10px_30px_rgba(26,26,26,0.04)] sm:px-6" style={{ borderColor: "var(--border)" }}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="apple-eyebrow">Directory</p>
              <h2 className="mt-2 text-[2rem] leading-none sm:text-[2.4rem]" style={{ fontFamily: "var(--font-heading)" }}>
                Exposure by customer
              </h2>
            </div>

            <label className="block w-full max-w-[360px]">
              <span className="sr-only">Search customers</span>
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name or phone"
                className="apple-input h-12 rounded-full px-5 text-sm"
              />
            </label>
          </div>

          <div className="mt-6">
            {loading ? (
              <div className="space-y-4 py-4">
                {[0, 1, 2].map((row) => (
                  <div key={row} className="shimmer h-24 rounded-[20px]" />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-[22px] border px-5 py-6" style={{ borderColor: "rgba(214,64,69,0.18)", background: "var(--coral-wash)" }}>
                <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--coral)" }}>
                  Unable to load customers
                </p>
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--ink-light)" }}>
                  {error}
                </p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="rounded-[22px] border px-5 py-12 text-center" style={{ borderColor: "var(--border)", background: "var(--cream)" }}>
                <h3 className="text-[2rem] leading-none" style={{ fontFamily: "var(--font-heading)" }}>
                  No customers match this search.
                </h3>
                <p className="mt-3 text-sm leading-6" style={{ color: "var(--ink-light)" }}>
                  Try a shorter company name or a phone fragment.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-[24px] border" style={{ borderColor: "var(--border)" }}>
                <div
                  className="hidden grid-cols-[minmax(0,2fr)_150px_160px_120px] gap-4 border-b px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] md:grid"
                  style={{ borderColor: "var(--border)", background: "var(--cream)", color: "var(--ink-muted)" }}
                >
                  <div>Customer</div>
                  <div>Phone</div>
                  <div>Outstanding</div>
                  <div className="text-right">Invoices</div>
                </div>

                <div className="bg-white">
                  {filteredCustomers.map((customer, index) => {
                    const width = Math.max((customer.outstanding / maxOutstanding) * 100, customer.outstanding > 0 ? 8 : 0);

                    return (
                      <Link
                        key={customer.id}
                        href={`/customers/${customer.id}`}
                        className={`block px-4 py-4 transition-colors hover:bg-[rgba(10,143,132,0.03)] md:px-5 ${index === 0 ? "" : "border-t"}`}
                        style={{ borderColor: "var(--border)" }}
                      >
                        <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_150px_160px_120px] md:items-center">
                          <div className="min-w-0">
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                                style={{ background: "var(--teal-wash)", color: "var(--teal-dark)" }}
                              >
                                {initials(customer.name)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="h-2 w-2 shrink-0 rounded-full"
                                    style={{ background: healthDot(customer.maxDaysOverdue).color }}
                                    title={customer.maxDaysOverdue === 0 ? "Current" : `${customer.maxDaysOverdue}d overdue`}
                                  />
                                  <div className="truncate text-base font-semibold tracking-[-0.03em]" style={{ color: "var(--ink)" }}>
                                    {customer.name}
                                  </div>
                                </div>
                                <div className="mt-1 truncate text-xs uppercase tracking-[0.18em]" style={{ color: "var(--ink-muted)" }}>
                                  {customer.city || "City not tagged"}
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 h-[3px] rounded-full" style={{ background: "rgba(10,143,132,0.08)" }}>
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${width}%`,
                                  background: "linear-gradient(90deg, #0A8F84 0%, #067A70 100%)",
                                }}
                              />
                            </div>
                          </div>

                          <div className="text-sm" style={{ color: "var(--ink-light)" }}>
                            {customer.phone || "No phone"}
                          </div>

                          <div>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] md:hidden" style={{ color: "var(--ink-muted)" }}>
                              Outstanding
                            </div>
                            <div className="mt-1 text-sm font-semibold tracking-[-0.02em]" style={{ color: "var(--ink)" }}>
                              {formatCurrency(customer.outstanding)}
                            </div>
                          </div>

                          <div className="text-left md:text-right">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] md:hidden" style={{ color: "var(--ink-muted)" }}>
                              Invoices
                            </div>
                            <div className="mt-1 text-sm font-semibold tracking-[-0.02em]" style={{ color: "var(--ink)" }}>
                              {customer.invoiceCount}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
