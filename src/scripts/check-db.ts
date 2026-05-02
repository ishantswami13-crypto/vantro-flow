import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function checkTables() {
  const sql = neon(process.env.DATABASE_URL!);
  
  // Check which tables exist
  const tables = await sql`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `;
  console.log("Existing tables:", tables.map(t => t.table_name));

  // Check expenses table columns if it exists
  const expensesCols = await sql`
    SELECT column_name, data_type, udt_name FROM information_schema.columns 
    WHERE table_name = 'expenses' AND table_schema = 'public'
    ORDER BY ordinal_position
  `;
  if (expensesCols.length > 0) {
    console.log("\nExpenses table columns:");
    expensesCols.forEach(c => console.log(`  ${c.column_name}: ${c.data_type} (${c.udt_name})`));
  }

  // Check vendors table
  const vendorsCols = await sql`
    SELECT column_name, data_type, udt_name FROM information_schema.columns 
    WHERE table_name = 'vendors' AND table_schema = 'public'
    ORDER BY ordinal_position
  `;
  if (vendorsCols.length > 0) {
    console.log("\nVendors table columns:");
    vendorsCols.forEach(c => console.log(`  ${c.column_name}: ${c.data_type} (${c.udt_name})`));
  }

  // Check payments table
  const paymentsCols = await sql`
    SELECT column_name, data_type, udt_name FROM information_schema.columns 
    WHERE table_name = 'payments' AND table_schema = 'public'
    ORDER BY ordinal_position
  `;
  if (paymentsCols.length > 0) {
    console.log("\nPayments table columns:");
    paymentsCols.forEach(c => console.log(`  ${c.column_name}: ${c.data_type} (${c.udt_name})`));
  }
}

checkTables().catch(err => { console.error(err); process.exit(1); });
