/**
 * Run this script in Neon console or via `tsx src/scripts/migrate-nova.ts`
 * to add all Nova OS tables.
 */
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log("Running Nova OS migration...");

  await sql`
    ALTER TABLE organizations
      ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMPTZ DEFAULT NOW()
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS plan_events (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER REFERENCES organizations(id),
      event_type VARCHAR(50) NOT NULL,
      from_plan VARCHAR(20),
      to_plan VARCHAR(20),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS payments_received (
      id SERIAL PRIMARY KEY,
      invoice_id INTEGER REFERENCES invoices(id),
      organization_id INTEGER REFERENCES organizations(id),
      amount DECIMAL(12,2) NOT NULL,
      payment_date DATE NOT NULL,
      payment_mode VARCHAR(20) DEFAULT 'upi',
      reference_number VARCHAR(100),
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS vendors (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER REFERENCES organizations(id),
      name VARCHAR(255) NOT NULL,
      contact_name VARCHAR(255),
      phone VARCHAR(20),
      email VARCHAR(255),
      category VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER REFERENCES organizations(id),
      vendor_id INTEGER REFERENCES vendors(id),
      title VARCHAR(255) NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      due_date DATE,
      paid_date DATE,
      status VARCHAR(20) DEFAULT 'pending',
      category VARCHAR(100),
      recurring BOOLEAN DEFAULT FALSE,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER REFERENCES organizations(id),
      name VARCHAR(255) NOT NULL,
      sku VARCHAR(100),
      hsn_code VARCHAR(20),
      category VARCHAR(100),
      unit VARCHAR(50),
      cost_price DECIMAL(12,2),
      selling_price DECIMAL(12,2),
      reorder_level INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS inventory (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(id),
      organization_id INTEGER REFERENCES organizations(id),
      quantity INTEGER DEFAULT 0,
      last_updated TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS nova_briefings (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER REFERENCES organizations(id),
      briefing_date DATE NOT NULL,
      content JSONB NOT NULL,
      health_score INTEGER,
      critical_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(organization_id, briefing_date)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS health_scores (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER REFERENCES organizations(id),
      score INTEGER NOT NULL,
      components JSONB NOT NULL,
      score_date DATE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(organization_id, score_date)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS alerts (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER REFERENCES organizations(id),
      type VARCHAR(50) NOT NULL,
      severity VARCHAR(20) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      action_url VARCHAR(500),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_payments_org ON payments_received(organization_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_expenses_org ON expenses(organization_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_nova_briefings ON nova_briefings(organization_id, briefing_date)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_health_scores ON health_scores(organization_id, score_date)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_alerts_unread ON alerts(organization_id, is_read)`;

  console.log("Nova OS migration complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
