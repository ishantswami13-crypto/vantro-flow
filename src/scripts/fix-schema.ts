import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)

async function fixSchema() {
  console.log('Fixing schema — adding missing columns...')

  // organizations: add missing columns
  await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS contact_name TEXT`
  await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS email TEXT`
  await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS company_scale TEXT`
  await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS selected_modules TEXT`
  await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false`
  await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP`
  await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS gst_number TEXT`
  await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ`
  await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')`
  await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS customer_count_limit INTEGER DEFAULT 5`
  await sql`ALTER TABLE organizations ALTER COLUMN plan TYPE VARCHAR(20)`
  await sql`ALTER TABLE organizations ALTER COLUMN plan SET DEFAULT 'starter'`
  await sql`UPDATE organizations SET plan = 'starter' WHERE plan IS NULL OR plan = 'free'`
  console.log('✓ organizations columns added')

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
  `
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
  `
  console.log('✓ plans synced')

  // customers: add missing columns
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_outstanding DECIMAL(12,2) DEFAULT 0`
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS avg_payment_delay_days INTEGER DEFAULT 0`
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'hinglish'`
  console.log('✓ customers columns added')

  // invoices: add missing columns
  await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS days_overdue INTEGER DEFAULT 0`
  await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS aging_bucket TEXT DEFAULT 'current'`
  console.log('✓ invoices columns added')

  console.log('\nSchema fix complete.')
}

fixSchema().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
