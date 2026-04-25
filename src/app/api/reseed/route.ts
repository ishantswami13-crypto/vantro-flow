export const dynamic = "force-dynamic";

import { neon } from "@neondatabase/serverless";

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function daysAgo(days: number) {
  return addDays(-days);
}

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!);

  try {
    await sql`INSERT INTO organizations (id, name, city, onboarding_completed) VALUES (1, 'Vantro Flow', 'Delhi', true) ON CONFLICT (id) DO NOTHING`;
    await sql`UPDATE organizations SET name = COALESCE(NULLIF(name, ''), 'Vantro Flow'), city = COALESCE(NULLIF(city, ''), 'Delhi'), onboarding_completed = true WHERE id = 1`;

    await sql`DELETE FROM follow_ups WHERE organization_id = 1`;
    await sql`DELETE FROM payment_promises WHERE organization_id = 1`;
    await sql`DELETE FROM invoices WHERE organization_id = 1`;
    await sql`DELETE FROM customers WHERE organization_id = 1`;

    const [northstar] = (await sql`
      INSERT INTO customers (organization_id, name, phone, whatsapp_number, email, city, status)
      VALUES (1, 'Northstar Retail', '9810012345', '9810012345', 'accounts@northstar.example', 'Mumbai', 'active')
      RETURNING id
    `) as { id: number }[];

    const [kumar] = (await sql`
      INSERT INTO customers (organization_id, name, phone, whatsapp_number, email, city, status)
      VALUES (1, 'Kumar & Sons', '9810023456', '9810023456', 'finance@kumar.example', 'Delhi', 'active')
      RETURNING id
    `) as { id: number }[];

    const [sharma] = (await sql`
      INSERT INTO customers (organization_id, name, phone, whatsapp_number, email, city, status)
      VALUES (1, 'Sharma Electricals', '9810034567', '9810034567', 'ap@sharma.example', 'Bengaluru', 'active')
      RETURNING id
    `) as { id: number }[];

    const [gupta] = (await sql`
      INSERT INTO customers (organization_id, name, phone, whatsapp_number, email, city, status)
      VALUES (1, 'Gupta Distributors', '9810045678', '9810045678', 'ledger@gupta.example', 'Jaipur', 'active')
      RETURNING id
    `) as { id: number }[];

    const [mehta] = (await sql`
      INSERT INTO customers (organization_id, name, phone, whatsapp_number, email, city, status)
      VALUES (1, 'Mehta Traders', '9810056789', '9810056789', 'billing@mehta.example', 'Pune', 'active')
      RETURNING id
    `) as { id: number }[];

    await sql`
      INSERT INTO invoices (organization_id, customer_id, invoice_number, invoice_date, due_date, amount, amount_paid, status, days_overdue, aging_bucket)
      VALUES
        (1, ${northstar.id}, 'INV-001', ${daysAgo(110)}, ${daysAgo(90)}, 450000, 0, 'unpaid', 90, '60+'),
        (1, ${kumar.id}, 'INV-002', ${daysAgo(65)}, ${daysAgo(45)}, 230000, 0, 'unpaid', 45, '31-60'),
        (1, ${sharma.id}, 'INV-003', ${daysAgo(52)}, ${daysAgo(35)}, 120000, 0, 'unpaid', 35, '31-60'),
        (1, ${gupta.id}, 'INV-004', ${daysAgo(30)}, ${daysAgo(18)}, 95000, 0, 'unpaid', 18, '1-30'),
        (1, ${mehta.id}, 'INV-005', ${daysAgo(20)}, ${daysAgo(5)}, 85000, 0, 'unpaid', 5, '1-30'),
        (1, ${gupta.id}, 'INV-006', ${daysAgo(3)}, ${addDays(7)}, 320000, 0, 'unpaid', 0, 'current'),
        (1, ${sharma.id}, 'INV-007', ${daysAgo(45)}, ${daysAgo(28)}, 150000, 150000, 'paid', 0, 'paid'),
        (1, ${mehta.id}, 'INV-008', ${daysAgo(35)}, ${daysAgo(15)}, 200000, 200000, 'paid', 0, 'paid')
    `;

    return Response.json({
      ok: true,
      customers: 5,
      invoices: 8,
      buckets: {
        current: 320000,
        aging1to30: 180000,
        aging31to60: 350000,
        aging60plus: 450000,
      },
    });
  } catch (error) {
    console.error("[api/reseed] failed", error);
    return Response.json({ error: error instanceof Error ? error.message : "Reseed failed" }, { status: 500 });
  }
}
