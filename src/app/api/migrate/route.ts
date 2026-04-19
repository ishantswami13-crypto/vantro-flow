export const dynamic = "force-dynamic";

import { neon } from "@neondatabase/serverless";

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!);

  try {
    // organizations: add missing columns
    await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS contact_name TEXT`;
    await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS email TEXT`;
    await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS company_scale TEXT`;
    await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS selected_modules TEXT`;
    await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false`;
    await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP`;
    await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS gst_number TEXT`;

    // customers: add missing columns
    await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_outstanding DECIMAL(12,2) DEFAULT 0`;
    await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS avg_payment_delay_days INTEGER DEFAULT 0`;
    await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'hinglish'`;

    // invoices: add missing columns
    await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS days_overdue INTEGER DEFAULT 0`;
    await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS aging_bucket TEXT DEFAULT 'current'`;

    // verify
    const cols = await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'organizations' ORDER BY ordinal_position
    `;

    return Response.json({
      ok: true,
      orgColumns: cols.map((c) => (c as { column_name: string }).column_name),
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Migration failed" },
      { status: 500 }
    );
  }
}
