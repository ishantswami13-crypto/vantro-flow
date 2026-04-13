import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import AddNoteButton from "@/components/AddNoteButton";
import CustomerInvoiceList from "@/components/CustomerInvoiceList";
import { db } from "@/db";
import { customers, follow_ups, invoices } from "@/db/schema";

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

function activityConfig(type: string) {
  if (type === "whatsapp") {
    return { icon: "W", color: "#059669", label: "WhatsApp" };
  }

  if (type === "call") {
    return { icon: "C", color: "#0A8F84", label: "Call" };
  }

  if (type === "email") {
    return { icon: "@", color: "#2563EB", label: "Email" };
  }

  if (type === "promise") {
    return { icon: "P", color: "#7C3AED", label: "Promise" };
  }

  if (type === "payment") {
    return { icon: "₹", color: "#059669", label: "Payment" };
  }

  return { icon: "N", color: "#0F172A", label: "Note" };
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
}

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
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
  const overdueCount = customerInvoices.filter(
    (invoice) => invoice.status !== "paid" && Number(invoice.days_overdue ?? 0) > 0
  ).length;

  return (
    <main className="min-h-screen pt-16" style={{ background: "var(--bg-base)" }}>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <Link href="/customers" className="mb-5 inline-flex text-sm font-medium" style={{ color: "var(--teal)" }}>
          ← Back to Customers
        </Link>

        <section className="mb-8">
          <div
            className="relative overflow-hidden rounded-[34px] px-6 py-7 sm:px-8"
            style={{
              background: "linear-gradient(135deg, rgba(230,247,246,0.95) 0%, rgba(255,255,255,0.98) 72%)",
              border: "1px solid rgba(10,143,132,0.12)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div
              className="absolute -top-12 right-8 h-40 w-40 rounded-full blur-3xl"
              style={{ background: "rgba(10,143,132,0.12)" }}
            />
            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex gap-5">
                <div
                  className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[28px] text-2xl font-bold"
                  style={{
                    background: "white",
                    color: "var(--teal)",
                    border: "2px solid rgba(10,143,132,0.18)",
                    boxShadow: "0 18px 36px rgba(10,143,132,0.12)",
                    fontFamily: "var(--font-syne, 'Bricolage Grotesque')",
                  }}
                >
                  {initials(customer.name)}
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--teal)" }}>
                    Customer Profile
                  </p>
                  <h1 className="mt-2 text-4xl font-bold" style={{ color: "var(--text-1)" }}>
                    {customer.name}
                  </h1>
                  <p className="mt-2 text-sm" style={{ color: "var(--text-3)" }}>
                    {customer.phone}
                    {customer.city ? ` · ${customer.city}` : ""}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { label: "Outstanding", value: formatCurrency(totalOutstanding), color: "var(--coral)" },
                  { label: "Overdue", value: overdueCount.toString(), color: "var(--amber)" },
                  {
                    label: "Invoices",
                    value: customerInvoices.length.toString(),
                    color: "var(--teal)",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-[24px] px-4 py-4"
                    style={{
                      background: "rgba(255,255,255,0.9)",
                      border: "1px solid rgba(255,255,255,0.92)",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-4)" }}>
                      {stat.label}
                    </p>
                    <p className="mt-2 text-xl font-bold" style={{ color: stat.color, fontFamily: "var(--font-syne, 'Bricolage Grotesque')" }}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold" style={{ color: "var(--text-1)" }}>
                Invoice ledger
              </h2>
              <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
                Clean view of every invoice, due date, and collection action.
              </p>
            </div>
            <div
              className="rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{ background: "white", border: "1px solid var(--border)", color: "var(--text-3)", boxShadow: "var(--shadow-sm)" }}
            >
              {customerInvoices.length} total
            </div>
          </div>
          <CustomerInvoiceList customerId={customer.id} invoices={customerInvoices} />
        </section>

        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold" style={{ color: "var(--text-1)" }}>
                Communication timeline
              </h2>
              <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
                Every reminder, note, promise, and payment update in chronological order.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{ background: "white", border: "1px solid var(--border)", color: "var(--text-3)", boxShadow: "var(--shadow-sm)" }}
              >
                {commsHistory.length} records
              </div>
              <AddNoteButton customerId={customer.id} />
            </div>
          </div>

          {commsHistory.length === 0 ? (
            <div
              className="rounded-[28px] p-12 text-center"
              style={{ background: "white", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
            >
              <p className="text-lg font-semibold" style={{ fontFamily: "var(--font-syne, 'Bricolage Grotesque')" }}>
                No communication history yet
              </p>
              <p className="mt-2 text-sm" style={{ color: "var(--text-3)" }}>
                Notes and reminders will appear here as your team engages this customer.
              </p>
            </div>
          ) : (
            <div className="relative">
              <div
                className="absolute left-6 top-0 bottom-0 w-px"
                style={{ background: "linear-gradient(to bottom, rgba(10,143,132,0.28), rgba(10,143,132,0.04))" }}
              />
              <div className="space-y-4 pl-14">
                {commsHistory.map((item) => {
                  const config = activityConfig(item.activity_type);

                  return (
                    <div key={item.id} className="relative">
                      <div
                        className="absolute -left-14 top-5 flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold"
                        style={{ background: `${config.color}16`, color: config.color }}
                      >
                        {config.icon}
                      </div>

                      <div
                        className="rounded-[26px] px-5 py-4"
                        style={{
                          background: "white",
                          border: "1px solid var(--border)",
                          boxShadow: "var(--shadow-sm)",
                        }}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                                {config.label}
                              </span>
                              {item.invoice_number ? (
                                <span
                                  className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                                  style={{ background: "var(--bg-surface-2)", color: "var(--text-3)" }}
                                >
                                  {item.invoice_number}
                                </span>
                              ) : null}
                            </div>
                            <p className="text-sm leading-6" style={{ color: "var(--text-2)" }}>
                              {item.message_text || "No message body recorded for this activity."}
                            </p>
                          </div>
                          <div className="shrink-0 text-xs" style={{ color: "var(--text-4)" }}>
                            {item.performed_at
                              ? new Date(item.performed_at).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "-"}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
