export const dynamic = "force-dynamic";

import { neon } from "@neondatabase/serverless";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!);

  try {
    // Clear existing data for org 1 in dependency order
    await sql`DELETE FROM follow_ups WHERE organization_id = 1`;
    await sql`DELETE FROM payment_promises WHERE organization_id = 1`;
    await sql`DELETE FROM invoices WHERE organization_id = 1`;
    await sql`DELETE FROM customers WHERE organization_id = 1`;
    await sql`
      UPDATE organizations
      SET city = COALESCE(NULLIF(city, ''), 'Delhi')
      WHERE id = 1
    `;

    // Insert customers
    const [amit] = await sql`
      INSERT INTO customers (organization_id, name, phone, city, status)
      VALUES (1, 'Amit Traders', '9810012345', 'Mumbai', 'active') RETURNING id
    ` as { id: number }[];
    const [kumar] = await sql`
      INSERT INTO customers (organization_id, name, phone, city, status)
      VALUES (1, 'Kumar & Sons', '9810023456', 'Dubai', 'active') RETURNING id
    ` as { id: number }[];
    const [sharma] = await sql`
      INSERT INTO customers (organization_id, name, phone, city, status)
      VALUES (1, 'Sharma Electrical', '9810034567', 'Bengaluru', 'active') RETURNING id
    ` as { id: number }[];
    const [gupta] = await sql`
      INSERT INTO customers (organization_id, name, phone, city, status)
      VALUES (1, 'Gupta Distributors', '9810045678', 'Singapore', 'active') RETURNING id
    ` as { id: number }[];
    const [mehta] = await sql`
      INSERT INTO customers (organization_id, name, phone, city, status)
      VALUES (1, 'Mehta Traders', '9810056789', 'London', 'active') RETURNING id
    ` as { id: number }[];

    const amitId = amit.id;
    const kumarId = kumar.id;
    const sharmaId = sharma.id;
    const guptaId = gupta.id;
    const mehtaId = mehta.id;

    // INV-001: Amit Traders ₹4,50,000 — 90 days overdue (60+ bucket)
    await sql`
      INSERT INTO invoices (organization_id, customer_id, invoice_number, invoice_date, due_date, amount, amount_paid, status)
      VALUES (1, ${amitId}, 'INV-001', ${daysAgo(110)}, ${daysAgo(90)}, 450000, 0, 'pending')
    `;
    // INV-002: Amit Traders ₹1,20,000 — 35 days overdue (31–60 bucket)
    await sql`
      INSERT INTO invoices (organization_id, customer_id, invoice_number, invoice_date, due_date, amount, amount_paid, status)
      VALUES (1, ${amitId}, 'INV-002', ${daysAgo(50)}, ${daysAgo(35)}, 120000, 0, 'pending')
    `;
    // INV-003: Kumar & Sons ₹2,30,000 — 45 days overdue (31–60 bucket)
    await sql`
      INSERT INTO invoices (organization_id, customer_id, invoice_number, invoice_date, due_date, amount, amount_paid, status)
      VALUES (1, ${kumarId}, 'INV-003', ${daysAgo(60)}, ${daysAgo(45)}, 230000, 0, 'pending')
    `;
    // INV-004: Sharma Electrical ₹85,000 — 15 days overdue (1–30 bucket)
    await sql`
      INSERT INTO invoices (organization_id, customer_id, invoice_number, invoice_date, due_date, amount, amount_paid, status)
      VALUES (1, ${sharmaId}, 'INV-004', ${daysAgo(30)}, ${daysAgo(15)}, 85000, 0, 'pending')
    `;
    // INV-005: Sharma Electrical ₹1,50,000 — PAID 20 days ago
    await sql`
      INSERT INTO invoices (organization_id, customer_id, invoice_number, invoice_date, due_date, amount, amount_paid, status)
      VALUES (1, ${sharmaId}, 'INV-005', ${daysAgo(35)}, ${daysAgo(20)}, 150000, 150000, 'paid')
    `;
    // INV-006: Gupta Distributors ₹3,20,000 — due in +7 days (Current bucket)
    await sql`
      INSERT INTO invoices (organization_id, customer_id, invoice_number, invoice_date, due_date, amount, amount_paid, status)
      VALUES (1, ${guptaId}, 'INV-006', ${daysAgo(5)}, ${daysFromNow(7)}, 320000, 0, 'pending')
    `;
    // INV-007: Mehta Traders ₹2,00,000 — PAID 10 days ago
    await sql`
      INSERT INTO invoices (organization_id, customer_id, invoice_number, invoice_date, due_date, amount, amount_paid, status)
      VALUES (1, ${mehtaId}, 'INV-007', ${daysAgo(20)}, ${daysAgo(10)}, 200000, 200000, 'paid')
    `;
    // INV-008: Mehta Traders ₹95,000 — 5 days overdue (1–30 bucket, below > 7 filter)
    await sql`
      INSERT INTO invoices (organization_id, customer_id, invoice_number, invoice_date, due_date, amount, amount_paid, status)
      VALUES (1, ${mehtaId}, 'INV-008', ${daysAgo(12)}, ${daysAgo(5)}, 95000, 0, 'pending')
    `;

    return Response.json({ success: true, count: 8 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Reseed failed" },
      { status: 500 }
    );
  }
}
