import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { neon } from '@neondatabase/serverless'
import { normalizeNovaPlan, canUse } from '@/lib/nova-plans'

export const dynamic = 'force-dynamic'

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!)
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

  try {
    const org = await sql`SELECT id, plan, name FROM organizations LIMIT 1`
    if (!org.length) return NextResponse.json({ headline: 'No organization found.', urgency: 'low', critical_items: [] })

    const orgId = org[0].id as number
    const plan = normalizeNovaPlan(org[0].plan as string)

    const today = new Date().toISOString().split('T')[0]
    const cached = await sql`
      SELECT content, health_score FROM nova_briefings
      WHERE organization_id = ${orgId} AND briefing_date = ${today}
    `
    if (cached.length > 0) {
      return NextResponse.json(cached[0].content)
    }

    const [invoices, customers, expenses, inventory] = await Promise.all([
      sql`
        SELECT i.id, i.amount, i.due_date, i.status, c.name as customer_name, c.phone
        FROM invoices i JOIN customers c ON i.customer_id = c.id
        WHERE i.organization_id = ${orgId} AND i.status != 'paid'
        ORDER BY i.due_date ASC
      `,
      sql`SELECT id FROM customers WHERE organization_id = ${orgId}`,
      sql`
        SELECT title, amount, due_date, status FROM expenses
        WHERE organization_id = ${orgId} AND status = 'pending'
        AND due_date >= CURRENT_DATE
        LIMIT 5
      `.catch(() => [] as Record<string, unknown>[]),
      sql`
        SELECT p.name, i.quantity, p.reorder_level, p.cost_price
        FROM inventory i JOIN products p ON i.product_id = p.id
        WHERE p.organization_id = ${orgId} AND i.quantity <= p.reorder_level
        LIMIT 5
      `.catch(() => [] as Record<string, unknown>[]),
    ])

    const now = Date.now()
    const overdueInvoices = invoices
      .map((inv) => ({
        customer: inv.customer_name as string,
        amount: Number(inv.amount),
        days_overdue: Math.floor((now - new Date(inv.due_date as string).getTime()) / 86400000),
        phone: inv.phone as string,
      }))
      .filter((inv) => inv.days_overdue > 0)
      .sort((a, b) => b.days_overdue - a.days_overdue)

    const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0)

    if (!canUse(plan, 'nova_ai_full')) {
      const basicBriefing = {
        headline: overdueInvoices.length > 0
          ? `${overdueInvoices.length} accounts need attention. ₹${(totalOverdue / 100000).toFixed(1)}L overdue.`
          : 'No overdue accounts today.',
        urgency: overdueInvoices.length > 2 ? 'high' : 'medium',
        health_score: 60,
        critical_items: overdueInvoices.slice(0, 2).map((inv) => ({
          type: 'collections',
          headline: `${inv.customer}: ₹${(inv.amount / 100000).toFixed(1)}L, ${inv.days_overdue} days overdue`,
          recommended_action: 'Send a payment reminder.',
          action_type: 'whatsapp',
          amount_at_risk: inv.amount,
        })),
        todays_priorities: overdueInvoices.slice(0, 3).map((inv) => `Follow up with ${inv.customer}`),
        nova_locked: true,
        upgrade_message: 'Upgrade to Pro to unlock full Nova AI analysis.',
      }
      return NextResponse.json(basicBriefing)
    }

    const dataContext = JSON.stringify({
      overdue_invoices: overdueInvoices.slice(0, 10),
      total_overdue_rupees: totalOverdue,
      upcoming_expenses: expenses.slice(0, 5),
      low_stock_items: inventory.slice(0, 5),
      total_customers: customers.length,
    })

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1000,
      messages: [
        {
          role: 'system',
          content: `You are Nova, Vantro's AI financial intelligence engine.
Analyze real business data and generate a morning briefing that feels like a message from a brilliant, trusted financial advisor.

RULES:
- Be specific with real numbers, real customer names, real amounts
- Write like you know this business personally
- Maximum 4 critical items
- Each item must have ONE clear recommended action
- Warm, direct, confident tone — not robotic
- Return ONLY valid JSON, no markdown, no preamble

OUTPUT FORMAT:
{
  "headline": "string — one punchy line summarizing today",
  "urgency": "high|medium|low",
  "health_score": number 0-100,
  "cash_runway_days": number or null,
  "critical_items": [
    {
      "type": "collections|expense|inventory|cashflow|anomaly",
      "headline": "string",
      "detail": "string — 1-2 sentences, specific and actionable",
      "recommended_action": "string — exactly what to do",
      "action_type": "call|whatsapp|review|reorder|pay",
      "amount_at_risk": number or null
    }
  ],
  "todays_priorities": ["string", "string", "string"],
  "one_good_thing": "string — something positive about the business"
}`,
        },
        {
          role: 'user',
          content: `Analyze this business data and generate today's briefing:\n${dataContext}`,
        },
      ],
    })

    const rawText = completion.choices[0]?.message?.content ?? '{}'
    let briefingData: Record<string, unknown>
    try {
      briefingData = JSON.parse(rawText) as Record<string, unknown>
    } catch {
      briefingData = {
        headline: `${overdueInvoices.length} accounts need attention.`,
        urgency: 'medium',
        health_score: 65,
        critical_items: [],
        todays_priorities: [],
        one_good_thing: 'Nova is analyzing your business.',
      }
    }

    await sql`
      INSERT INTO nova_briefings (organization_id, briefing_date, content, health_score)
      VALUES (${orgId}, ${today}, ${JSON.stringify(briefingData)}, ${(briefingData.health_score as number) ?? 65})
      ON CONFLICT (organization_id, briefing_date) DO UPDATE
      SET content = ${JSON.stringify(briefingData)}
    `

    return NextResponse.json(briefingData)
  } catch (error) {
    console.error('Nova briefing error:', error)
    return NextResponse.json(
      { headline: 'Nova is starting up...', urgency: 'low', critical_items: [], health_score: 65 },
      { status: 200 }
    )
  }
}
