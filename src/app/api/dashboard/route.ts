export const dynamic = 'force-dynamic'

import { db } from '@/db'
import { invoices, customers } from '@/db/schema'

export async function GET() {
  try {
    const allInvoices = await db.select().from(invoices)
    const allCustomers = await db.select().from(customers)

    const pending = allInvoices.filter((i: any) => i.status !== 'paid')
    const paid = allInvoices.filter((i: any) => i.status === 'paid')

    const totalOutstanding = pending.reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0)
    const collectedThisMonth = paid.reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0)
    const activeCustomers = new Set(pending.map((i: any) => i.customerId)).size
    const collectionRate = allInvoices.length > 0
      ? Math.round((paid.length / allInvoices.length) * 100)
      : 0

    const today = new Date()

    const followUpList = pending
      .map((inv: any) => {
        const dueDate = new Date(inv.dueDate)
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        const customer = allCustomers.find((c: any) => c.id === inv.customerId)
        return {
          id: inv.id,
          customerName: customer?.name || 'Unknown',
          invoiceNumber: inv.invoiceNumber,
          amount: Number(inv.amount || 0),
          dueDate: inv.dueDate,
          daysOverdue: Math.max(0, daysOverdue),
          customerId: inv.customerId,
          invoiceId: inv.id
        }
      })
      .filter((i: any) => i.daysOverdue > 7)
      .sort((a: any, b: any) => b.daysOverdue - a.daysOverdue)
      .slice(0, 10)

    const agingBuckets = {
      current: { amount: 0, count: 0 },
      aging1to30: { amount: 0, count: 0 },
      aging31to60: { amount: 0, count: 0 },
      aging60plus: { amount: 0, count: 0 }
    }

    pending.forEach((inv: any) => {
      const dueDate = new Date(inv.dueDate)
      const days = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      const amt = Number(inv.amount || 0)
      if (days <= 0) { agingBuckets.current.amount += amt; agingBuckets.current.count++ }
      else if (days <= 30) { agingBuckets.aging1to30.amount += amt; agingBuckets.aging1to30.count++ }
      else if (days <= 60) { agingBuckets.aging31to60.amount += amt; agingBuckets.aging31to60.count++ }
      else { agingBuckets.aging60plus.amount += amt; agingBuckets.aging60plus.count++ }
    })

    return Response.json({
      totalOutstanding,
      collectedThisMonth,
      activeCustomers,
      collectionRate,
      followUpList,
      agingBuckets,
      weekForecast: {
        expectedThisWeek: 0,
        promisesDue: 0,
        overdueRisk: agingBuckets.aging60plus.amount
      }
    })

  } catch (error: any) {
    console.error('Dashboard API error:', error?.message || error)
    return Response.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}
