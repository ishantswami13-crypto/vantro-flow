import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  console.log("Running migrations...");

  await sql`
    CREATE TABLE IF NOT EXISTS organizations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      contact_name TEXT,
      email TEXT,
      business_type TEXT,
      company_scale TEXT,
      selected_modules TEXT,
      onboarding_completed BOOLEAN DEFAULT FALSE,
      onboarding_completed_at TIMESTAMP,
      gst_number TEXT,
      city TEXT,
      state TEXT,
      plan VARCHAR(20) DEFAULT 'starter',
      plan_expires_at TIMESTAMPTZ,
      trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
      customer_count_limit INTEGER DEFAULT 5,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log("organizations");

  await sql`
    CREATE TABLE IF NOT EXISTS plans (
      id SERIAL PRIMARY KEY,
      name VARCHAR(20) NOT NULL UNIQUE,
      price_monthly INTEGER NOT NULL,
      price_annual INTEGER NOT NULL,
      customer_limit INTEGER,
      features JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log("plans");

  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER REFERENCES organizations(id),
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      whatsapp_number TEXT,
      email TEXT,
      city TEXT,
      total_outstanding NUMERIC(12,2) DEFAULT 0,
      avg_payment_delay_days INTEGER DEFAULT 0,
      preferred_language TEXT DEFAULT 'hinglish',
      status TEXT DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log("customers");

  await sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER REFERENCES organizations(id),
      customer_id INTEGER REFERENCES customers(id),
      invoice_number TEXT NOT NULL,
      invoice_date DATE,
      due_date DATE,
      amount NUMERIC(12,2) NOT NULL,
      amount_paid NUMERIC(12,2) DEFAULT 0,
      status TEXT DEFAULT 'unpaid',
      days_overdue INTEGER DEFAULT 0,
      aging_bucket TEXT DEFAULT 'current',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log("invoices");

  await sql`
    CREATE TABLE IF NOT EXISTS payment_promises (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER REFERENCES organizations(id),
      customer_id INTEGER REFERENCES customers(id),
      invoice_id INTEGER REFERENCES invoices(id),
      promised_amount NUMERIC(12,2),
      promised_date DATE,
      promised_via TEXT,
      notes TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log("payment_promises");

  await sql`
    CREATE TABLE IF NOT EXISTS follow_ups (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER REFERENCES organizations(id),
      customer_id INTEGER REFERENCES customers(id),
      invoice_id INTEGER REFERENCES invoices(id),
      activity_type TEXT NOT NULL,
      message_text TEXT,
      performed_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log("follow_ups");

  await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS contact_name TEXT`;
  await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS email TEXT`;
  await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS company_scale TEXT`;
  await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS selected_modules TEXT`;
  await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP`;
  await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ`;
  await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')`;
  await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS customer_count_limit INTEGER DEFAULT 5`;
  await sql`ALTER TABLE organizations ALTER COLUMN plan TYPE VARCHAR(20)`;
  await sql`ALTER TABLE organizations ALTER COLUMN plan SET DEFAULT 'starter'`;
  await sql`UPDATE organizations SET plan = 'starter' WHERE plan IS NULL OR plan = 'free'`;
  console.log("organizations columns synced");

  await sql`CREATE UNIQUE INDEX IF NOT EXISTS plans_name_idx ON plans(name)`;
  await sql`
    INSERT INTO plans (name, price_monthly, price_annual, customer_limit, features)
    VALUES
      ('starter', 0, 0, 5, '{"ai_briefing":"basic","cash_forecast":false,"health_score":"view_only","whatsapp_messages_per_day":1,"inventory":false,"expense_tracking":false,"invoice_generator":false,"multi_user":false,"api_access":false}'::jsonb),
      ('pro', 3499, 34990, NULL, '{"ai_briefing":"full","cash_forecast":true,"health_score":"full","whatsapp_messages_per_day":"unlimited","inventory":"100_skus","expense_tracking":true,"invoice_generator":true,"multi_user":false,"api_access":false}'::jsonb),
      ('enterprise', 0, 0, NULL, '{"ai_briefing":"full","cash_forecast":true,"health_score":"full","whatsapp_messages_per_day":"unlimited","inventory":"unlimited","expense_tracking":true,"invoice_generator":true,"multi_user":true,"api_access":true,"tally_sync":true,"bank_sync":true,"white_label":true}'::jsonb)
    ON CONFLICT (name) DO UPDATE SET
      price_monthly = EXCLUDED.price_monthly,
      price_annual = EXCLUDED.price_annual,
      customer_limit = EXCLUDED.customer_limit,
      features = EXCLUDED.features
  `;
  console.log("plans seeded");

  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS whatsapp_number TEXT`;
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS email TEXT`;
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS city TEXT`;
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_outstanding NUMERIC(12,2) DEFAULT 0`;
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS avg_payment_delay_days INTEGER DEFAULT 0`;
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'hinglish'`;
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'`;
  console.log("customers columns synced");

  console.log("\nAll tables created successfully.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
