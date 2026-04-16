export const dynamic = 'force-dynamic'
import { neon } from '@neondatabase/serverless'
export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const result = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    return Response.json({ tables: result.map((r: any) => r.table_name) })
  } catch (error: any) {
    return Response.json({ error: error.message })
  }
}
