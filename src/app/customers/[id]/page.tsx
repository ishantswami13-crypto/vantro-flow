export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import AddNoteButton from "@/components/AddNoteButton";
import CustomerInvoiceList from "@/components/CustomerInvoiceList";
import { db } from "@/db";
import { customers, follow_ups, invoices } from "@/db/schema";
import { getDefaultOrganizationProfile } from "@/lib/organization-profile";

async function getCustomerData(id: number) {
  const [customer] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  if (!customer) {
    return null;
  }

  const [customerInvoices, commsHistory] = await Promise.all([
    db
      .select({
        id: invoices.id,
        invoice_number: invoices.invoice_number,
        invoice_date: invoices.invoice_date,
        due_date: invoices.due_date,
        amount: invoices.amount,
        amount_paid: invoices.amount_paid,
        status: invoices.status,
        days_overdue: invoices.days_overdue,
        aging_bucket: invoices.aging_bucket,
      })
      .from(invoices)
      .where(eq(invoices.customer_id, id))
      .orderBy(invoices.due_date),
    db
      .select({
        id: follow_ups.id,
        activity_type: follow_ups.activity_type,
        message_text: follow_ups.message_text,
        performed_at: follow_ups.performed_at,
        invoice_number: invoices.invoice_number,
      })
      .from(follow_ups)
      .leftJoin(invoices, eq(follow_ups.invoice_id, invoices.id))
      .where(eq(follow_ups.customer_id, id))
      .orderBy(desc(follow_ups.performed_at))
      .limit(50),
  ]);

  return { customer, invoices: customerInvoices, commsHistory };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatActivityDate(value: string | Date | null) {
  if (!value) {
    return "No activity yet";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function activityConfig(type: string) {
  if (type === "whatsapp") {
    return { icon: "WA", color: "#14833B", label: "WhatsApp" };
  }

  if (type === "call") {
    return { icon: "CL", color: "#0071E3", label: "Call" };
  }

  if (type === "email") {
    return { icon: "EM", color: "#4A90E2", label: "Email" };
  }

  if (type === "promise") {
    return { icon: "PR", color: "#6E6EE8", label: "Promise" };
  }

  if (type === "payment") {
    return { icon: "PD", color: "#14833B", label: "Payment" };
  }

  return { icon: "NT", color: "#1D1D1F", label: "Note" };
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
}

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const organizationProfile = await getDefaultOrganizationProfile();
  if (!organizationProfile.onboardingCompleted) {
    redirect("/welcome");
  }
  if (!organizationProfile.selectedModules.includes("customer_ledgers")) {
    redirect("/");
  }

  const { id } = await params;
  const data = await getCustomerData(Number.parseInt(id, 10));

  if (!data) {
    notFound();
  }

  const { customer, invoices: customerInvoices, commsHistory } = data;
  const totalOutstanding = customerInvoices.reduce(
    (sum, invoice) => sum + Math.max(Number(invoice.amount) - Number(invoice.amount_paid ?? 0), 0),
    0
  );
  const openInvoiceCount = customerInvoices.filter((invoice) => invoice.status !== "paid").length;
  const overdueCount = customerInvoices.filter(
    (invoice) => invoice.status !== "paid" && Number(invoice.days_overdue ?? 0) > 0
  ).length;
  const averageInvoiceValue = customerInvoices.length ? Math.round(totalOutstanding / customerInvoices.length) : 0;
  const lastActivity = commsHistory[0]?.performed_at ?? null;

  return (
    <main className="min-h-screen pt-24 sm:pt-28" style={{ background: "var(--bg-base)" }}>
      <div className="mx-auto max-w-[1320px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link href="/customers" className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: "var(--accent)" }}>
            <span>Back to customers</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <span className="linear-tag">{customerInvoices.length} invoices</span>
            <span className="linear-tag">{commsHistory.length} activities</span>
          </div>
        </div>

        <section className="surface-panel rounded-[24px] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px] text-lg font-semibold"
                style={{
                  background: "var(--accent-soft)",
                  color: "var(--accent)",
                  border: "1px solid rgba(94, 106, 210, 0.16)",
                }}
              >
                {initials(customer.name)}
              </div>

              <div className="min-w-0">
                <p className="apple-eyebrow">Customer</p>
                <h1 className="mt-2 truncate text-[1.9rem] font-semibold leading-[1] tracking-[-0.05em] sm:text-[2.2rem]">
                  {customer.name}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="linear-tag">{customer.phone}</span>
                  {customer.city ? <span className="linear-tag">{customer.city}</span> : null}
                  <span className="linear-tag">{openInvoiceCount} open invoices</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:min-w-[580px]">
              {[
                { label: "Outstanding", value: formatCurrency(totalOutstanding), color: "var(--danger)" },
                { label: "Open", value: openInvoiceCount.toString(), color: "var(--text-1)" },
                { label: "Overdue", value: overdueCount.toString(), color: "var(--warning)" },
                { label: "Avg balance", value: formatCurrency(averageInvoiceValue), color: "var(--accent)" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[18px] px-4 py-3.5"
                  style={{ background: "var(--bg-surface-2)", border: "1px solid var(--border)" }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-4)" }}>
                    {stat.label}
                  </p>
                  <p className="mt-1.5 text-base font-semibold tracking-[-0.03em] sm:text-lg" style={{ color: stat.color }}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_360px]">
          <div className="min-w-0">
            <CustomerInvoiceList customerId={customer.id} invoices={customerInvoices} />
          </div>

          <aside className="space-y-6">
            <div className="linear-panel rounded-[22px] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold tracking-[-0.02em]">Account context</h2>
                  <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
                    Contact details and current collection posture for this account.
                  </p>
                </div>
                <AddNoteButton customerId={customer.id} />
              </div>

              <div className="mt-5 space-y-4">
                {[
                  { label: "Primary contact", value: customer.phone },
                  { label: "Location", value: customer.city ?? "Not tagged" },
                  { label: "Last activity", value: formatActivityDate(lastActivity) },
                  { label: "Activity records", value: commsHistory.length.toString() },
                ].map((item, index) => (
                  <div
                    key={item.label}
                    className={index === 0 ? "flex items-start justify-between gap-4" : "flex items-start justify-between gap-4 border-t pt-4"}
                    style={{ borderColor: "var(--border)" }}
                  >
                    <span className="text-sm" style={{ color: "var(--text-3)" }}>
                      {item.label}
                    </span>
                    <span className="text-right text-sm font-medium" style={{ color: "var(--text-1)" }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="linear-panel overflow-hidden rounded-[22px]">
              <div className="flex items-start justify-between gap-3 border-b px-5 py-4" style={{ borderColor: "var(--border)" }}>
                <div>
                  <h2 className="text-base font-semibold tracking-[-0.02em]">Communication timeline</h2>
                  <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
                    Notes, reminders, promises, and payment updates for this customer.
                  </p>
                </div>
                <span className="linear-tag">{commsHistory.length}</span>
              </div>

              {commsHistory.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-base font-semibold tracking-[-0.02em]">No communication history yet</p>
                  <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
                    Notes and reminders will appear here as your team engages this account.
                  </p>
                </div>
              ) : (
                <div className="max-h-[720px] overflow-y-auto">
                  {commsHistory.map((item, index) => {
                    const config = activityConfig(item.activity_type);

                    return (
                      <div
                        key={item.id}
                        className={index === 0 ? "px-5 py-4" : "border-t px-5 py-4"}
                        style={{ borderColor: "var(--border)" }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-[10px] font-semibold"
                            style={{ background: `${config.color}16`, color: config.color }}
                          >
                            {config.icon}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                                {config.label}
                              </span>
                              {item.invoice_number ? <span className="linear-tag">{item.invoice_number}</span> : null}
                            </div>
                            <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-2)" }}>
                              {item.message_text || "No message body recorded for this activity."}
                            </p>
                          </div>

                          <div className="shrink-0 text-xs" style={{ color: "var(--text-4)" }}>
                            {formatActivityDate(item.performed_at)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
