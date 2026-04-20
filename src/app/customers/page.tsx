export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import CustomerList from "@/components/CustomerList";
import { db } from "@/db";
import { customers, invoices } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getDefaultOrganizationProfile } from "@/lib/organization-profile";

async function getCustomers() {
  return db
    .select({
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
      city: customers.city,
      total_outstanding: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} != 'paid' THEN ${invoices.amount} ELSE 0 END), 0)`,
      invoice_count: sql<number>`COUNT(${invoices.id})`,
    })
    .from(customers)
    .leftJoin(invoices, eq(invoices.customer_id, customers.id))
    .groupBy(customers.id, customers.name, customers.phone, customers.city)
    .orderBy(customers.name);
}

function formatCurrency(value: number) {
  return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value || 0)}`;
}

export default async function CustomersPage() {
  const organizationProfile = await getDefaultOrganizationProfile();
  if (!organizationProfile.onboardingCompleted) {
    redirect("/welcome");
  }
  if (!organizationProfile.selectedModules.includes("customer_ledgers")) {
    redirect("/");
  }

  const data = await getCustomers();
  const totalOutstanding = data.reduce((sum, customer) => sum + Number(customer.total_outstanding), 0);

  return (
    <main className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <div className="mx-auto max-w-[1320px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="mb-5">
          <div className="surface-panel rounded-[24px] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-xl">
                <p className="apple-eyebrow">Customer Ledger</p>
                <h1 className="mt-2 text-[1.7rem] font-semibold leading-[1] tracking-[-0.05em] sm:text-[2rem]">
                  Accounts in follow-up
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 sm:text-[0.95rem]" style={{ color: "var(--text-3)" }}>
                  Search companies, review open exposure, and move straight into invoice-level collection work.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:min-w-[520px]">
                {[
                  { label: "Customers", value: data.length.toString() },
                  { label: "Outstanding", value: formatCurrency(totalOutstanding) },
                  {
                    label: "Average exposure",
                    value: formatCurrency(data.length ? Math.round(totalOutstanding / data.length) : 0),
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-[18px] px-4 py-3.5"
                    style={{
                      background: "var(--bg-surface-2)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-4)" }}>
                      {stat.label}
                    </p>
                    <p className="mt-1.5 text-base font-semibold tracking-[-0.03em] sm:text-lg" style={{ color: "var(--text-1)" }}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {data.length === 0 ? (
          <div
            className="surface-panel rounded-[24px] px-6 py-14 text-center"
          >
            <p className="text-lg font-semibold tracking-[-0.03em]">No customers yet</p>
            <p className="mt-2 text-sm" style={{ color: "var(--text-3)" }}>
              Upload your invoice book to generate a live customer portfolio.
            </p>
          </div>
        ) : (
          <CustomerList customers={data} />
        )}
      </div>
    </main>
  );
}
