import { neon } from '@neondatabase/serverless'

// This uses the VERCEL database URL directly
const VERCEL_DB_URL = 'postgresql://neondb_owner:npg_nOvPA4Wwo9qU@ep-morning-recipe-a117sgi8-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

const sql = neon(VERCEL_DB_URL)

async function createTables() {
  console.log('Creating tables in Vercel Neon database...')

  await sql`DROP TABLE IF EXISTS follow_ups CASCADE`
  await sql`DROP TABLE IF EXISTS payment_promises CASCADE`
  await sql`DROP TABLE IF EXISTS invoices CASCADE`
  await sql`DROP TABLE IF EXISTS customers CASCADE`
  await sql`DROP TABLE IF EXISTS plans CASCADE`
  await sql`DROP TABLE IF EXISTS organizations CASCADE`
  console.log('Dropped old tables')

  await sql`CREATE TABLE organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    business_type VARCHAR(50),
    city VARCHAR(100),
    state VARCHAR(50),
    plan VARCHAR(20) DEFAULT 'starter',
    plan_expires_at TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    customer_count_limit INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT NOW()
  )`
  console.log('✓ organizations')

  await sql`CREATE TABLE plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE,
    price_monthly INTEGER NOT NULL,
    price_annual INTEGER NOT NULL,
    customer_limit INTEGER,
    features JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`
  console.log('✓ plans')

  await sql`CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    whatsapp_number VARCHAR(20),
    email VARCHAR(255),
    city VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
  )`
  console.log('✓ customers')

  await sql`CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id),
    customer_id INTEGER REFERENCES customers(id),
    invoice_number VARCHAR(100) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    amount_paid DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`
  console.log('✓ invoices')

  await sql`CREATE TABLE payment_promises (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id),
    customer_id INTEGER REFERENCES customers(id),
    invoice_id INTEGER REFERENCES invoices(id),
    promised_amount DECIMAL(15,2) NOT NULL,
    promised_date DATE NOT NULL,
    promised_via VARCHAR(50),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
  )`
  console.log('✓ payment_promises')

  await sql`CREATE TABLE follow_ups (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id),
    customer_id INTEGER REFERENCES customers(id),
    invoice_id INTEGER REFERENCES invoices(id),
    activity_type VARCHAR(50) NOT NULL,
    message_text TEXT,
    performed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
  )`
  console.log('✓ follow_ups')

  await sql`INSERT INTO organizations (name, business_type, city, state, plan, customer_count_limit)
    VALUES ('Demo Business', 'distributor', 'Delhi', 'Delhi', 'starter', 5)`
  console.log('✓ seeded organization')

  await sql`
    INSERT INTO plans (name, price_monthly, price_annual, customer_limit, features)
    VALUES
      ('starter', 0, 0, 5, '{"ai_briefing":"basic","cash_forecast":false,"health_score":"view_only","whatsapp_messages_per_day":1,"inventory":false,"expense_tracking":false,"invoice_generator":false,"multi_user":false,"api_access":false}'::jsonb),
      ('pro', 3499, 34990, NULL, '{"ai_briefing":"full","cash_forecast":true,"health_score":"full","whatsapp_messages_per_day":"unlimited","inventory":"100_skus","expense_tracking":true,"invoice_generator":true,"multi_user":false,"api_access":false}'::jsonb),
      ('enterprise', 0, 0, NULL, '{"ai_briefing":"full","cash_forecast":true,"health_score":"full","whatsapp_messages_per_day":"unlimited","inventory":"unlimited","expense_tracking":true,"invoice_generator":true,"multi_user":true,"api_access":true,"tally_sync":true,"bank_sync":true,"white_label":true}'::jsonb)
  `
  console.log('✓ seeded plans')

  console.log('ALL DONE - Vercel database ready!')
}

createTables().catch(console.error)
