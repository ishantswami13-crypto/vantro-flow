export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, ne, sql } from "drizzle-orm";
import AnalyticsChartsWrapper from "@/components/AnalyticsChartsWrapper";
import { db } from "@/db";
import { customers, invoices } from "@/db/schema";
import { getDefaultOrganizationProfile } from "@/lib/organization-profile";

async function getAnalyticsData() {
  const [aging, topCustomers, avgOverdue, monthly, allInvoices, paidInvoices] = await Promise.all([
    db
      .select({
        bucket: invoices.aging_bucket,
        total: sql<number>`COALESCE(SUM(${invoices.amount}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(invoices)
      .where(ne(invoices.status, "paid"))
      .groupBy(invoices.aging_bucket),

    db
      .select({
        id: customers.id,
        name: customers.name,
        outstanding: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} != 'paid' THEN ${invoices.amount} ELSE 0 END), 0)`,
        overdue_invoices: sql<number>`COUNT(*) FILTER (WHERE ${invoices.days_overdue} > 0 AND ${invoices.status} != 'paid')`,
      })
      .from(customers)
      .leftJoin(invoices, eq(invoices.customer_id, customers.id))
      .groupBy(customers.id, customers.name)
      .orderBy(sql`3 DESC`)
      .limit(5),

    db.select({
      avg_days: sql<number>`COALESCE(AVG(CASE WHEN ${invoices.days_overdue} > 0 AND ${invoices.status} != 'paid' THEN ${invoices.days_overdue} ELSE NULL END), 0)`,
    }).from(invoices),

    db
      .select({
        month: sql<string>`TO_CHAR(${invoices.created_at}, 'Mon YYYY')`,
        month_order: sql<string>`TO_CHAR(${invoices.created_at}, 'YYYY-MM')`,
        collected: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'paid' THEN ${invoices.amount} ELSE 0 END), 0)`,
        count: sql<number>`COUNT(*) FILTER (WHERE ${invoices.status} = 'paid')`,
      })
      .from(invoices)
      .where(sql`${invoices.created_at} >= NOW() - INTERVAL '6 months'`)
      .groupBy(sql`TO_CHAR(${invoices.created_at}, 'Mon YYYY'), TO_CHAR(${invoices.created_at}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${invoices.created_at}, 'YYYY-MM')`),

    db.select({ id: invoices.id }).from(invoices),
    db.select({ id: invoices.id }).from(invoices).where(sql`${invoices.status} = 'paid'`),
  ]);

  const collectionRate =
    allInvoices.length > 0 ? Math.round((paidInvoices.length / allInvoices.length) * 100) : 0;

  return { aging, topCustomers, avgOverdue: avgOverdue[0].avg_days, monthly, collectionRate };
}

function formatCurrency(value: number | string) {
  const numericValue = typeof value === "string" ? Number.parseFloat(value) : value;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(numericValue);
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = ["#0071E3", "#4A90E2", "#7F8EA3", "#C2471A", "#14833B", "#8B7CF7"];

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

export default async function AnalyticsPage() {
  const organizationProfile = await getDefaultOrganizationProfile();
  if (!organizationProfile.onboardingCompleted) {
    redirect("/welcome");
  }
  if (!organizationProfile.selectedModules.includes("portfolio_analytics")) {
    redirect("/");
  }

  const { aging, topCustomers, avgOverdue, monthly, collectionRate } = await getAnalyticsData();
  const totalOutstanding = aging.reduce((sum, bucket) => sum + Number(bucket.total), 0);
  const totalUnpaidInvoices = aging.reduce((sum, bucket) => sum + Number(bucket.count), 0);
  const maxCustomerOutstanding = Math.max(...topCustomers.map((customer) => Number(customer.outstanding)), 1);

  return (
    <main className="min-h-screen pt-24 sm:pt-28" style={{ background: "var(--bg-base)" }}>
      <div className="mx-auto max-w-[1320px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="mb-6">
          <div
            className="surface-panel rounded-[24px] p-6"
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="apple-eyebrow">Analytics</p>
                <h1 className="mt-3 text-[2rem] font-semibold leading-[1] tracking-[-0.05em] sm:text-[2.4rem]">
                  Collections intelligence
                </h1>
                <p className="mt-3 text-sm leading-6 sm:text-base" style={{ color: "var(--text-3)" }}>
                  Read aging exposure, collection velocity, and concentration risk in one operating view.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[520px]">
                {[
                  { label: "Outstanding", value: formatCurrency(totalOutstanding), color: "var(--danger)" },
                  { label: "Collection rate", value: `${collectionRate}%`, color: "var(--accent)" },
                  { label: "Average overdue", value: `${Math.round(avgOverdue)}d`, color: "var(--warning)" },
                  { label: "Unpaid invoices", value: totalUnpaidInvoices.toString(), color: "var(--text-1)" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-[16px] px-4 py-4"
                    style={{
                      background: "var(--bg-surface-2)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-4)" }}>
                      {stat.label}
                    </p>
                    <p className="mt-2 text-lg font-semibold tracking-[-0.04em]" style={{ color: stat.color }}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <AnalyticsChartsWrapper
          aging={aging}
          monthly={monthly}
          topCustomers={topCustomers}
          collectionRate={collectionRate}
        />

        <section className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.03em]" style={{ color: "var(--text-1)" }}>
                Top customers by outstanding
              </h2>
              <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
                Accounts carrying the highest unpaid concentration.
              </p>
            </div>
          </div>

          <div
            className="rounded-[32px] p-6"
            style={{ background: "rgba(255,255,255,0.74)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
          >
            {topCustomers.filter((customer) => Number(customer.outstanding) > 0).length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-lg font-semibold tracking-[-0.03em]">No outstanding balances</p>
                <p className="mt-2 text-sm" style={{ color: "var(--text-3)" }}>
                  Your receivables book is currently clean.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {topCustomers
                  .filter((customer) => Number(customer.outstanding) > 0)
                  .map((customer, index) => {
                    const color = avatarColor(customer.name);
                    const progress = Math.max((Number(customer.outstanding) / maxCustomerOutstanding) * 100, 4);

                    return (
                      <div key={customer.id}>
                        <div className="mb-2 flex items-center gap-3">
                          <span className="w-5 text-center text-xs font-semibold" style={{ color: "var(--text-4)" }}>
                            {index + 1}
                          </span>
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold"
                            style={{
                              background: `${color}16`,
                              color,
                              border: `1px solid ${color}24`,
                            }}
                          >
                            {initials(customer.name)}
                          </div>
                          <Link
                            href={`/customers/${customer.id}`}
                            className="min-w-0 flex-1 truncate text-sm font-semibold tracking-[-0.02em]"
                            style={{ color: "var(--text-1)" }}
                          >
                            {customer.name}
                          </Link>
                          {Number(customer.overdue_invoices) > 0 ? (
                            <span
                              className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                              style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
                            >
                              {customer.overdue_invoices} overdue
                            </span>
                          ) : null}
                          <span className="text-sm font-semibold tracking-[-0.03em]">
                            {formatCurrency(customer.outstanding)}
                          </span>
                        </div>
                        <div className="ml-8 rounded-full" style={{ background: "var(--bg-surface-3)" }}>
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${progress}%`,
                              background: "linear-gradient(90deg, #0071E3, #4A90E2)",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
