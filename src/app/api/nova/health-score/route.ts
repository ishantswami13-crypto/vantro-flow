import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!)

  try {
    const org = await sql`SELECT id FROM organizations LIMIT 1`
    const orgId = org[0].id as number

    const [invoices, expenses, inventory] = await Promise.all([
      sql`SELECT amount, due_date, status FROM invoices WHERE organization_id = ${orgId}`,
      sql`
        SELECT amount, due_date, paid_date, status, created_at
        FROM expenses WHERE organization_id = ${orgId}
      `.catch(() => [] as Record<string, unknown>[]),
      sql`
        SELECT i.quantity, i.last_updated, p.cost_price, p.reorder_level
        FROM inventory i JOIN products p ON i.product_id = p.id
        WHERE p.organization_id = ${orgId}
      `.catch(() => [] as Record<string, unknown>[]),
    ])

    const now = Date.now()

    // 1. Cash Position Score (25%)
    const confirmedExpenses = expenses
      .filter((e) => e.status === 'pending' && new Date(e.due_date as string).getTime() < now + 7 * 86400000)
      .reduce((s, e) => s + Number(e.amount), 0)

    const highConfidenceInflow = invoices
      .filter((i) => {
        if (i.status === 'paid') return false
        const daysOverdue = Math.floor((now - new Date(i.due_date as string).getTime()) / 86400000)
        return daysOverdue < 30
      })
      .reduce((s, i) => s + Number(i.amount) * 0.7, 0)

    const runwayDays = confirmedExpenses > 0
      ? Math.floor((highConfidenceInflow / confirmedExpenses) * 30)
      : 60

    const cashScore =
      runwayDays > 90 ? 100 :
      runwayDays > 60 ? 85 :
      runwayDays > 30 ? 70 :
      runwayDays > 15 ? 50 :
      runwayDays > 7  ? 30 : 10

    // 2. Collections Health Score (30%)
    const totalReceivables = invoices
      .filter((i) => i.status !== 'paid')
      .reduce((s, i) => s + Number(i.amount), 0)

    const currentReceivables = invoices
      .filter((i) => {
        if (i.status === 'paid') return false
        const daysOverdue = Math.floor((now - new Date(i.due_date as string).getTime()) / 86400000)
        return daysOverdue <= 30
      })
      .reduce((s, i) => s + Number(i.amount), 0)

    const hasVeryLate = invoices.some((i) => {
      if (i.status === 'paid') return false
      return Math.floor((now - new Date(i.due_date as string).getTime()) / 86400000) > 90
    })

    const currentRatio = totalReceivables > 0 ? currentReceivables / totalReceivables : 1
    let collectionsScore =
      currentRatio > 0.7 ? 100 :
      currentRatio > 0.5 ? 75 :
      currentRatio > 0.3 ? 50 : 25
    if (hasVeryLate) collectionsScore = Math.max(0, collectionsScore - 15)

    // 3. Expense Control Score (20%)
    const recentExpenses = expenses
      .filter((e) => now - new Date(e.created_at as string).getTime() < 30 * 86400000)
      .reduce((s, e) => s + Number(e.amount), 0)
    const olderExpenses = expenses
      .filter((e) => {
        const age = now - new Date(e.created_at as string).getTime()
        return age >= 30 * 86400000 && age < 60 * 86400000
      })
      .reduce((s, e) => s + Number(e.amount), 0)

    const expenseGrowth = olderExpenses > 0 ? (recentExpenses - olderExpenses) / olderExpenses : 0
    const expenseScore =
      expenseGrowth < 0.05 ? 100 :
      expenseGrowth < 0.15 ? 75 :
      expenseGrowth < 0.30 ? 50 : 25

    // 4. Inventory Health Score (15%)
    let inventoryScore = 70
    if (inventory.length > 0) {
      const deadStock = inventory.filter((item) => {
        const daysSinceUpdate = Math.floor((now - new Date(item.last_updated as string).getTime()) / 86400000)
        return daysSinceUpdate > 60
      })
      const deadRatio = deadStock.length / inventory.length
      inventoryScore =
        deadRatio < 0.1 ? 100 :
        deadRatio < 0.3 ? 75 :
        deadRatio < 0.5 ? 50 : 25
    }

    // 5. Revenue Consistency (10%)
    const revenueScore = 70

    const overall = Math.round(
      cashScore * 0.25 +
      collectionsScore * 0.30 +
      expenseScore * 0.20 +
      inventoryScore * 0.15 +
      revenueScore * 0.10
    )

    const components = { cash: cashScore, collections: collectionsScore, expenses: expenseScore, inventory: inventoryScore, revenue: revenueScore }
    const lowestKey = (Object.entries(components).sort(([, a], [, b]) => a - b)[0][0]) as keyof typeof components

    const improvements: Record<string, { action: string; impact: number }> = {
      collections: { action: 'Collect from your most overdue account', impact: 8 },
      cash:        { action: 'Reduce upcoming expenses or accelerate collections', impact: 6 },
      expenses:    { action: 'Review expenses that increased this month', impact: 5 },
      inventory:   { action: 'Clear dead stock — items not moved in 60+ days', impact: 5 },
      revenue:     { action: 'Follow up with inactive customers', impact: 4 },
    }

    const today = new Date().toISOString().split('T')[0]
    await sql`
      INSERT INTO health_scores (organization_id, score, components, score_date)
      VALUES (${orgId}, ${overall}, ${JSON.stringify(components)}, ${today})
      ON CONFLICT (organization_id, score_date) DO UPDATE
      SET score = ${overall}, components = ${JSON.stringify(components)}
    `

    const history = await sql`
      SELECT score, score_date FROM health_scores
      WHERE organization_id = ${orgId}
      ORDER BY score_date DESC LIMIT 30
    `

    const trend7d = history.length >= 7 ? overall - Number(history[6]?.score ?? overall) : 0

    return NextResponse.json({
      overall,
      trend_7d: trend7d,
      components,
      top_improvement: improvements[lowestKey],
      runway_days: runwayDays,
      history: [...history].reverse(),
    })
  } catch (error) {
    console.error('Health score error:', error)
    return NextResponse.json({ overall: 65, trend_7d: 0, components: {}, runway_days: 30 })
  }
}
