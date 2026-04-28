export const dynamic = "force-dynamic";

import { neon } from "@neondatabase/serverless";

type CustomerRow = {
  id: number;
  name: string;
  phone: string | null;
  city: string | null;
};

type InvoiceSummaryRow = {
  customer_id: number | null;
  count: string | number | null;
  outstanding: string | number | null;
  max_days_overdue: string | number | null;
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

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    const [customers, invoices] = (await Promise.all([
      sql`
        SELECT id, name, phone, city
        FROM customers
        ORDER BY name
      `,
      sql`
        SELECT
          customer_id,
          COUNT(*) AS count,
          SUM(
            CASE
              WHEN status != 'paid' THEN GREATEST(COALESCE(amount, 0) - COALESCE(amount_paid, 0), 0)
              ELSE 0
            END
          ) AS outstanding,
          COALESCE(MAX(
            CASE
              WHEN status != 'paid' AND due_date < CURRENT_DATE
              THEN GREATEST(CURRENT_DATE - due_date, 0)::int
              ELSE 0
            END
          ), 0) AS max_days_overdue
        FROM invoices
        GROUP BY customer_id
      `,
    ])) as [CustomerRow[], InvoiceSummaryRow[]];

    const invoiceMap = new Map(
      invoices.map((invoice) => [
        invoice.customer_id,
        {
          count: toNumber(invoice.count),
          outstanding: toNumber(invoice.outstanding),
          max_days_overdue: toNumber(invoice.max_days_overdue),
        },
      ])
    );

    const result = customers.map((customer) => {
      const invoice = invoiceMap.get(customer.id);

      return {
        ...customer,
        invoiceCount: invoice?.count ?? 0,
        outstanding: invoice?.outstanding ?? 0,
        maxDaysOverdue: invoice?.max_days_overdue ?? 0,
      };
    });

    return Response.json(result);
  } catch (error) {
    console.error("[api/customers] failed", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to load customers" },
      { status: 500 }
    );
  }
}
