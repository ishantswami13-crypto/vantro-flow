import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function migrate() {
  const sql = neon(process.env.DATABASE_URL!);
  
  // Drop and recreate expenses with integer IDs (old one had UUIDs)
  console.log("Dropping old expenses table (UUID ids)...");
  await sql`DROP TABLE IF EXISTS expenses CASCADE`;

  console.log("Recreating expenses table with integer ids...");
  await sql`
    CREATE TABLE expenses (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER REFERENCES organizations(id),
      vendor_id INTEGER REFERENCES vendors(id),
      category TEXT NOT NULL,
      description TEXT,
      amount NUMERIC(12, 2) NOT NULL,
      expense_date DATE NOT NULL,
      due_date DATE,
      status TEXT DEFAULT 'unpaid',
      amount_paid NUMERIC(12, 2) DEFAULT '0',
      payment_mode TEXT,
      paid_at TIMESTAMP,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  console.log("Creating payments table...");
  await sql`
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER REFERENCES organizations(id),
      type TEXT NOT NULL,
      invoice_id INTEGER REFERENCES invoices(id),
      expense_id INTEGER REFERENCES expenses(id),
      customer_id INTEGER REFERENCES customers(id),
      vendor_id INTEGER REFERENCES vendors(id),
      amount NUMERIC(12, 2) NOT NULL,
      payment_mode TEXT,
      reference_number TEXT,
      payment_date DATE NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  console.log("✅ All tables created successfully!");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
