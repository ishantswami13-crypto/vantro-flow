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
  console.log('✓ organizations columns added')

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
