export const dynamic = "force-dynamic";

import { neon } from "@neondatabase/serverless";

type TableRow = {
  table_name: string;
};

type InvoiceCountRow = {
  count: string | number;
};

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const tables = (await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `) as TableRow[];
    const invoiceCount = (await sql`
      SELECT COUNT(*) AS count
      FROM invoices
    `) as InvoiceCountRow[];
    const orgColumns = (await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'organizations'
      ORDER BY ordinal_position
    `) as { column_name: string }[];

    return Response.json({
      tables: tables.map((table) => table.table_name),
      invoiceCount: Number(invoiceCount[0]?.count ?? 0),
      orgColumns: orgColumns.map((c) => c.column_name),
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Database check failed" },
      { status: 500 }
    );
  }
}
