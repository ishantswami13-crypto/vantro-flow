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
  await sql`DROP TABLE IF EXISTS organizations CASCADE`
  console.log('Dropped old tables')

  await sql`CREATE TABLE organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    business_type VARCHAR(50),
    city VARCHAR(100),
    state VARCHAR(50),
    plan VARCHAR(20) DEFAULT 'free',
    created_at TIMESTAMP DEFAULT NOW()
  )`
  console.log('✓ organizations')

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

  await sql`INSERT INTO organizations (name, business_type, city, state, plan)
    VALUES ('Demo Business', 'distributor', 'Delhi', 'Delhi', 'free')`
  console.log('✓ seeded organization')

  console.log('ALL DONE - Vercel database ready!')
}

createTables().catch(console.error)
