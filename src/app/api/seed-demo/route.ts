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

export async function POST() {
  const sql = neon(process.env.DATABASE_URL!);

  try {
    // Clear existing demo data in dependency order
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

    // Insert invoices — exact aging buckets per product spec
    // 60+ days overdue: ₹4,50,000 + ₹2,30,000 + ₹95,000
    await sql`
      INSERT INTO invoices (organization_id, customer_id, invoice_number, invoice_date, due_date, amount, amount_paid, status)
      VALUES (1, ${amitId}, 'INV-001', ${daysAgo(120)}, ${daysAgo(90)}, 450000, 0, 'pending')
    `;
    await sql`
      INSERT INTO invoices (organization_id, customer_id, invoice_number, invoice_date, due_date, amount, amount_paid, status)
      VALUES (1, ${kumarId}, 'INV-002', ${daysAgo(100)}, ${daysAgo(70)}, 230000, 0, 'pending')
    `;
    await sql`
      INSERT INTO invoices (organization_id, customer_id, invoice_number, invoice_date, due_date, amount, amount_paid, status)
      VALUES (1, ${sharmaId}, 'INV-003', ${daysAgo(95)}, ${daysAgo(65)}, 95000, 0, 'pending')
    `;
    // 30–60 days overdue: ₹3,20,000 + ₹1,20,000
    await sql`
      INSERT INTO invoices (organization_id, customer_id, invoice_number, invoice_date, due_date, amount, amount_paid, status)
      VALUES (1, ${guptaId}, 'INV-004', ${daysAgo(75)}, ${daysAgo(45)}, 320000, 0, 'pending')
    `;
    await sql`
      INSERT INTO invoices (organization_id, customer_id, invoice_number, invoice_date, due_date, amount, amount_paid, status)
      VALUES (1, ${mehtaId}, 'INV-005', ${daysAgo(65)}, ${daysAgo(35)}, 120000, 0, 'pending')
    `;
    // 1–30 days overdue: ₹85,000
    await sql`
      INSERT INTO invoices (organization_id, customer_id, invoice_number, invoice_date, due_date, amount, amount_paid, status)
      VALUES (1, ${amitId}, 'INV-006', ${daysAgo(45)}, ${daysAgo(15)}, 85000, 0, 'pending')
    `;
    // Paid: ₹1,50,000 + ₹2,00,000
    await sql`
      INSERT INTO invoices (organization_id, customer_id, invoice_number, invoice_date, due_date, amount, amount_paid, status)
      VALUES (1, ${sharmaId}, 'INV-007', ${daysAgo(60)}, ${daysAgo(30)}, 150000, 150000, 'paid')
    `;
    await sql`
      INSERT INTO invoices (organization_id, customer_id, invoice_number, invoice_date, due_date, amount, amount_paid, status)
      VALUES (1, ${kumarId}, 'INV-008', ${daysAgo(50)}, ${daysAgo(20)}, 200000, 200000, 'paid')
    `;

    return Response.json({ ok: true, customers: 5, invoices: 8 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Seed failed" },
      { status: 500 }
    );
  }
}
