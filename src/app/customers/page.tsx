export const dynamic = 'force-dynamic';

import CustomerList from "@/components/CustomerList";
import { db } from "@/db";
import { customers, invoices } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

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
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function CustomersPage() {
  const data = await getCustomers();
  const totalOutstanding = data.reduce((sum, customer) => sum + Number(customer.total_outstanding), 0);

  return (
    <main className="min-h-screen pt-16" style={{ background: "var(--bg-base)" }}>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="mb-8">
          <div
            className="surface-panel rounded-[34px] p-6 sm:p-8"
            style={{ border: "1px solid rgba(255,255,255,0.92)", boxShadow: "var(--shadow-lg)" }}
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--teal)" }}>
                  Customers
                </p>
                <h1 className="mt-3 text-4xl font-bold" style={{ color: "var(--text-1)" }}>
                  Relationship ledger
                </h1>
                <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--text-3)" }}>
                  Search active accounts, scan exposure, and move straight into overdue collections.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { label: "Customers", value: data.length.toString() },
                  { label: "Outstanding", value: formatCurrency(totalOutstanding) },
                  {
                    label: "Avg per customer",
                    value: formatCurrency(data.length ? Math.round(totalOutstanding / data.length) : 0),
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-[24px] px-4 py-4"
                    style={{
                      background: "rgba(255,255,255,0.84)",
                      border: "1px solid rgba(255,255,255,0.92)",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-4)" }}>
                      {stat.label}
                    </p>
                    <p className="mt-2 text-lg font-bold" style={{ fontFamily: "var(--font-syne, 'Bricolage Grotesque')" }}>
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
            className="rounded-[28px] p-14 text-center"
            style={{ background: "white", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
          >
            <p className="text-lg font-semibold" style={{ fontFamily: "var(--font-syne, 'Bricolage Grotesque')" }}>
              No customers yet
            </p>
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
