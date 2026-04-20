export const dynamic = "force-dynamic";

import { neon } from "@neondatabase/serverless";

type InvoiceRow = {
  id: number;
  customer_id: number | null;
  amount: string | number | null;
  amount_paid: string | number | null;
  status: string | null;
  due_date: string | null;
};

type CustomerRow = {
  id: number;
  name: string;
};

function toNumber(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return value;
  }

  if (!value) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getOutstanding(invoice: InvoiceRow) {
  return Math.max(toNumber(invoice.amount) - toNumber(invoice.amount_paid), 0);
}

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    const [invoices, customers] = (await Promise.all([
      sql`
        SELECT id, customer_id, amount, amount_paid, status, due_date
        FROM invoices
      `,
      sql`
        SELECT id, name
        FROM customers
        ORDER BY name
      `,
    ])) as [InvoiceRow[], CustomerRow[]];

    const pending = invoices.filter((invoice) => invoice.status !== "paid");
    const paid = invoices.filter((invoice) => invoice.status === "paid");
    const totalOutstanding = pending.reduce((sum, invoice) => sum + getOutstanding(invoice), 0);
    const collectionRate = invoices.length > 0 ? Math.round((paid.length / invoices.length) * 100) : 0;
    const today = new Date();
    const aging = { current: 0, d1to30: 0, d31to60: 0, d60plus: 0 };

    pending.forEach((invoice) => {
      const outstanding = getOutstanding(invoice);
      const dueDate = invoice.due_date ? new Date(invoice.due_date) : null;
      const days = dueDate ? Math.floor((today.getTime() - dueDate.getTime()) / 86400000) : 0;

      if (days <= 0) {
        aging.current += outstanding;
      } else if (days <= 30) {
        aging.d1to30 += outstanding;
      } else if (days <= 60) {
        aging.d31to60 += outstanding;
      } else {
        aging.d60plus += outstanding;
      }
    });

    const topCustomers = customers
      .map((customer) => {
        const customerInvoices = pending.filter((invoice) => invoice.customer_id === customer.id);
        return {
          name: customer.name,
          outstanding: customerInvoices.reduce((sum, invoice) => sum + getOutstanding(invoice), 0),
        };
      })
      .sort((left, right) => right.outstanding - left.outstanding)
      .slice(0, 5);

    return Response.json({
      totalOutstanding,
      collectionRate,
      invoiceCount: invoices.length,
      aging,
      topCustomers,
    });
  } catch (error) {
    console.error("[api/analytics] failed", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to load analytics" },
      { status: 500 }
    );
  }
}
