export const dynamic = 'force-dynamic'
import { neon } from '@neondatabase/serverless'
export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const invoices = await sql`SELECT * FROM invoices`
    const customers = await sql`SELECT * FROM customers`
    const pending = invoices.filter((i: any) => i.status !== 'paid')
    const paid = invoices.filter((i: any) => i.status === 'paid')
    const totalOutstanding = pending.reduce((s: number, i: any) => s + Number(i.amount || 0), 0)
    const collectedThisMonth = paid.reduce((s: number, i: any) => s + Number(i.amount || 0), 0)
    const activeCustomers = new Set(pending.map((i: any) => i.customer_id)).size
    const collectionRate = invoices.length > 0 ? Math.round((paid.length / invoices.length) * 100) : 0
    const today = new Date()
    const followUpList = pending.map((inv: any) => {
      const daysOverdue = Math.floor((today.getTime() - new Date(inv.due_date).getTime()) / 86400000)
      const customer = customers.find((c: any) => c.id === inv.customer_id)
      return { id: inv.id, customerName: customer?.name || 'Unknown', invoiceNumber: inv.invoice_number, amount: Number(inv.amount || 0), dueDate: inv.due_date, daysOverdue: Math.max(0, daysOverdue), customerId: inv.customer_id, invoiceId: inv.id }
    }).filter((i: any) => i.daysOverdue > 7).sort((a: any, b: any) => b.daysOverdue - a.daysOverdue).slice(0, 10)
    const agingBuckets = { current:{amount:0,count:0}, aging1to30:{amount:0,count:0}, aging31to60:{amount:0,count:0}, aging60plus:{amount:0,count:0} }
    pending.forEach((inv: any) => {
      const days = Math.floor((today.getTime() - new Date(inv.due_date).getTime()) / 86400000)
      const amt = Number(inv.amount || 0)
      if (days <= 0) { agingBuckets.current.amount += amt; agingBuckets.current.count++ }
      else if (days <= 30) { agingBuckets.aging1to30.amount += amt; agingBuckets.aging1to30.count++ }
      else if (days <= 60) { agingBuckets.aging31to60.amount += amt; agingBuckets.aging31to60.count++ }
      else { agingBuckets.aging60plus.amount += amt; agingBuckets.aging60plus.count++ }
    })
    return Response.json({ totalOutstanding, collectedThisMonth, activeCustomers, collectionRate, followUpList, agingBuckets, weekForecast: { expectedThisWeek: 0, promisesDue: 0, overdueRisk: agingBuckets.aging60plus.amount } })
  } catch (error: any) {
    return Response.json({ error: error.message, stack: error.stack?.split('\n').slice(0,3) }, { status: 500 })
  }
}
