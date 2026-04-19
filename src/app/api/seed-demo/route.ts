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

    // Insert customers
    const [amit] = await sql`
      INSERT INTO customers (organization_id, name, phone, status)
      VALUES (1, 'Amit Traders', '9810012345', 'active') RETURNING id
    ` as { id: number }[];
    const [kumar] = await sql`
      INSERT INTO customers (organization_id, name, phone, status)
      VALUES (1, 'Kumar & Sons', '9810023456', 'active') RETURNING id
    ` as { id: number }[];
    const [sharma] = await sql`
      INSERT INTO customers (organization_id, name, phone, status)
      VALUES (1, 'Sharma Electrical', '9810034567', 'active') RETURNING id
    ` as { id: number }[];
    const [gupta] = await sql`
      INSERT INTO customers (organization_id, name, phone, status)
      VALUES (1, 'Gupta Distributors', '9810045678', 'active') RETURNING id
    ` as { id: number }[];
    const [mehta] = await sql`
      INSERT INTO customers (organization_id, name, phone, status)
      VALUES (1, 'Mehta Traders', '9810056789', 'active') RETURNING id
    ` as { id: number }[];

    const amitId = amit.id;
    const kumarId = kumar.id;
    const sharmaId = sharma.id;
    const guptaId = gupta.id;
    const mehtaId = mehta.id;

    // Insert invoices
    await sql`
      INSERT INTO invoices (organization_id, customer_id, invoice_number, invoice_date, due_date, amount, amount_paid, status)
      VALUES (1, ${amitId}, 'INV-001', ${daysAgo(120)}, ${daysAgo(90)}, 450000, 0, 'pending')
    `;
    await sql`
      INSERT INTO invoices (organization_id, customer_id, invoice_number, invoice_date, due_date, amount, amount_paid, status)
      VALUES (1, ${amitId}, 'INV-002', ${daysAgo(60)}, ${daysAgo(30)}, 120000, 0, 'pending')
    `;
    await sql`
      INSERT INTO invoices (organization_id, customer_id, invoice_number, invoice_date, due_date, amount, amount_paid, status)
      VALUES (1, ${kumarId}, 'INV-003', ${daysAgo(44)}, ${daysAgo(14)}, 230000, 0, 'pending')
    `;
    await sql`
      INSERT INTO invoices (organization_id, customer_id, invoice_number, invoice_date, due_date, amount, amount_paid, status)
      VALUES (1, ${sharmaId}, 'INV-004', ${daysAgo(30)}, ${daysFromNow(0)}, 85000, 0, 'pending')
    `;
    await sql`
      INSERT INTO invoices (organization_id, customer_id, invoice_number, invoice_date, due_date, amount, amount_paid, status)
      VALUES (1, ${sharmaId}, 'INV-005', ${daysAgo(60)}, ${daysAgo(7)}, 150000, 150000, 'paid')
    `;
    await sql`
      INSERT INTO invoices (organization_id, customer_id, invoice_number, invoice_date, due_date, amount, amount_paid, status)
      VALUES (1, ${guptaId}, 'INV-006', ${daysAgo(23)}, ${daysFromNow(7)}, 320000, 0, 'pending')
    `;
    await sql`
      INSERT INTO invoices (organization_id, customer_id, invoice_number, invoice_date, due_date, amount, amount_paid, status)
      VALUES (1, ${mehtaId}, 'INV-007', ${daysAgo(44)}, ${daysAgo(14)}, 200000, 200000, 'paid')
    `;
    await sql`
      INSERT INTO invoices (organization_id, customer_id, invoice_number, invoice_date, due_date, amount, amount_paid, status)
      VALUES (1, ${mehtaId}, 'INV-008', ${daysAgo(35)}, ${daysAgo(5)}, 95000, 0, 'pending')
    `;

    return Response.json({ ok: true, customers: 5, invoices: 8 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Seed failed" },
      { status: 500 }
    );
  }
}
