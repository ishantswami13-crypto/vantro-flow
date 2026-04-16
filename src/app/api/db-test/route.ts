export const dynamic = 'force-dynamic'
import { neon } from '@neondatabase/serverless'

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
    const invoiceCount = await sql`SELECT COUNT(*) FROM invoices`
    return Response.json({ tables: tables.map((t:any) => t.table_name), invoiceCount: invoiceCount[0].count })
  } catch (err: any) {
    return Response.json({ error: err.message })
  }
}
