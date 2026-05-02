import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { z } from 'zod'
import { PRIMARY_ORG_ID } from '@/lib/onboarding-config'

export const dynamic = 'force-dynamic'

const PaymentSchema = z.object({
  invoice_id: z.number().int().positive(),
  amount: z.number().positive(),
  payment_date: z.string(),
  payment_mode: z.enum(['upi', 'neft', 'rtgs', 'cash', 'cheque', 'other']),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
})

export async function POST(req: Request) {
  const sql = neon(process.env.DATABASE_URL!)

  try {
    const body = await req.json()
    const data = PaymentSchema.parse(body)
    const orgId = PRIMARY_ORG_ID

    await sql`
      INSERT INTO payments_received (invoice_id, organization_id, amount, payment_date, payment_mode, reference_number, notes)
      VALUES (${data.invoice_id}, ${orgId}, ${data.amount}, ${data.payment_date}, ${data.payment_mode}, ${data.reference_number ?? null}, ${data.notes ?? null})
    `

    const invoice = await sql`SELECT amount FROM invoices WHERE id = ${data.invoice_id}`
    const totalPaid = await sql`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments_received WHERE invoice_id = ${data.invoice_id}
    `

    const invoiceAmount = Number(invoice[0]?.amount ?? 0)
    const paidAmount = Number((totalPaid[0] as Record<string, unknown>).total ?? 0)
    const newStatus = paidAmount >= invoiceAmount ? 'paid' : 'partial'

    await sql`UPDATE invoices SET status = ${newStatus} WHERE id = ${data.invoice_id}`

    const today = new Date().toISOString().split('T')[0]
    await sql`
      DELETE FROM nova_briefings WHERE organization_id = ${orgId} AND briefing_date = ${today}
    `

    return NextResponse.json({ success: true, status: newStatus, paid_amount: paidAmount, invoice_amount: invoiceAmount })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error('Payment error:', error)
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
  }
}

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!)

  try {
    const payments = await sql`
      SELECT pr.*, i.amount as invoice_amount, c.name as customer_name
      FROM payments_received pr
      JOIN invoices i ON pr.invoice_id = i.id
      JOIN customers c ON i.customer_id = c.id
      WHERE pr.organization_id = ${PRIMARY_ORG_ID}
      ORDER BY pr.created_at DESC
      LIMIT 50
    `
    return NextResponse.json(payments)
  } catch (error) {
    console.error('Payments GET error:', error)
    return NextResponse.json([])
  }
}
