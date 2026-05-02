export const dynamic = "force-dynamic";
export const revalidate = 0;

import { notFound } from "next/navigation";
import { db } from "@/db";
import { invoices, customers, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import PaymentFlow from "./PaymentFlow";

async function getInvoiceData(invoice_number: string) {
  const [invoice] = await db
    .select({
      id: invoices.id,
      invoice_number: invoices.invoice_number,
      amount: invoices.amount,
      amount_paid: invoices.amount_paid,
      status: invoices.status,
      due_date: invoices.due_date,
      customer_name: customers.name,
      org_name: organizations.name,
    })
    .from(invoices)
    .innerJoin(customers, eq(invoices.customer_id, customers.id))
    .innerJoin(organizations, eq(invoices.organization_id, organizations.id))
    .where(eq(invoices.invoice_number, invoice_number))
    .limit(1);

  return invoice || null;
}

export default async function PayInvoicePage({ params }: { params: Promise<{ invoice_number: string }> }) {
  const { invoice_number } = await params;
  const invoice = await getInvoiceData(invoice_number);

  if (!invoice) {
    notFound();
  }

  const outstanding = Math.max(Number.parseFloat(invoice.amount) - Number.parseFloat(invoice.amount_paid ?? "0"), 0);
  const isPaid = invoice.status === "paid" || outstanding === 0;

  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6" style={{ background: "var(--bg-base)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--text-3)" }}>
            Secure Payment Portal
          </p>
          <h1 className="text-xl font-medium tracking-normal text-[var(--text-1)]">
            {invoice.org_name}
          </h1>
        </div>

        <div className="surface-panel rounded-[24px] p-6 sm:p-8 shadow-sm">
          <div className="mb-6 pb-6 border-b" style={{ borderColor: "var(--border)" }}>
            <p className="text-sm font-medium mb-1" style={{ color: "var(--text-2)" }}>Invoice for</p>
            <h2 className="text-2xl font-semibold mb-4 text-[var(--text-1)]">{invoice.customer_name}</h2>
            
            <div className="flex justify-between items-center text-sm">
              <span style={{ color: "var(--text-3)" }}>Invoice #</span>
              <span className="font-mono font-medium" style={{ color: "var(--text-1)" }}>{invoice.invoice_number}</span>
            </div>
            {invoice.due_date && (
              <div className="flex justify-between items-center text-sm mt-2">
                <span style={{ color: "var(--text-3)" }}>Due Date</span>
                <span className="font-medium" style={{ color: "var(--text-1)" }}>{invoice.due_date}</span>
              </div>
            )}
          </div>

          <div className="mb-8">
            <p className="text-sm font-medium mb-2 text-center" style={{ color: "var(--text-3)" }}>Total Due</p>
            <p className="text-4xl font-semibold tracking-tight text-center" style={{ color: "var(--text-1)" }}>
              ₹{new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(outstanding)}
            </p>
          </div>

          {isPaid ? (
            <div className="rounded-[16px] p-4 text-center" style={{ background: "var(--success-soft)", color: "var(--success)" }}>
              <p className="font-semibold mb-1">Invoice Paid</p>
              <p className="text-sm">Thank you for your payment.</p>
            </div>
          ) : (
            <PaymentFlow invoiceNumber={invoice.invoice_number} />
          )}
        </div>

        <div className="mt-8 text-center text-xs" style={{ color: "var(--text-4)" }}>
          <p>Powered by <strong>Vantro Flow</strong></p>
          <p className="mt-1">Secure · Instant · Encrypted</p>
        </div>
      </div>
    </main>
  );
}
