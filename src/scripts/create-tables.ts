import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)

async function createTables() {
  console.log('Creating tables...')

  await sql`
    CREATE TABLE IF NOT EXISTS organizations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      business_type VARCHAR(50),
      city VARCHAR(100),
      state VARCHAR(50),
      plan VARCHAR(20) DEFAULT 'free',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
  console.log('✓ organizations')

  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER REFERENCES organizations(id),
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      whatsapp_number VARCHAR(20),
      email VARCHAR(255),
      city VARCHAR(100),
      total_outstanding DECIMAL(15,2) DEFAULT 0,
      avg_payment_delay_days INTEGER DEFAULT 0,
      preferred_language VARCHAR(20) DEFAULT 'hindi',
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
  console.log('✓ customers')

  await sql`
    CREATE TABLE IF NOT EXISTS invoices (
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
    )
  `
  console.log('✓ invoices')

  await sql`
    CREATE TABLE IF NOT EXISTS payment_promises (
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
    )
  `
  console.log('✓ payment_promises')

  await sql`
    CREATE TABLE IF NOT EXISTS follow_ups (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER REFERENCES organizations(id),
      customer_id INTEGER REFERENCES customers(id),
      invoice_id INTEGER REFERENCES invoices(id),
      activity_type VARCHAR(50) NOT NULL,
      message_text TEXT,
      performed_at TIMESTAMP DEFAULT NOW()
    )
  `
  console.log('✓ follow_ups')

  console.log('\nAll tables created successfully.')
}

createTables().catch((err) => {
  console.error('Error creating tables:', err)
  process.exit(1)
})
