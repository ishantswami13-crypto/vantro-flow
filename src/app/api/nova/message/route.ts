import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { neon } from '@neondatabase/serverless'
import { normalizeNovaPlan, canUse } from '@/lib/nova-plans'
import { PRIMARY_ORG_ID } from '@/lib/onboarding-config'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const sql = neon(process.env.DATABASE_URL!)
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

  const body = await req.json() as {
    customer_name: string
    amount: number
    days_overdue: number
    phone: string
    invoice_id: number
  }
  const { customer_name, amount, days_overdue, phone } = body

  const org = await sql`SELECT plan FROM organizations WHERE id = ${PRIMARY_ORG_ID} LIMIT 1`
  const plan = normalizeNovaPlan(org[0]?.plan as string)

  if (!canUse(plan, 'nova_ai_full')) {
    const today = new Date().toISOString().split('T')[0]
    const msgCount = await sql`
      SELECT COUNT(*) as count FROM alerts
      WHERE organization_id = ${PRIMARY_ORG_ID}
      AND type = 'whatsapp_generated'
      AND created_at::date = ${today}
    `
    if (Number((msgCount[0] as Record<string, unknown>).count) >= 1) {
      return NextResponse.json(
        { error: 'daily_limit', message: 'Daily limit reached. Upgrade Pro for unlimited messages.' },
        { status: 403 }
      )
    }
    await sql`
      INSERT INTO alerts (organization_id, type, severity, title, message)
      VALUES (${PRIMARY_ORG_ID}, 'whatsapp_generated', 'info', 'Message generated', 'Starter daily limit used')
    `
  }

  const amountLakhs = (amount / 100000).toFixed(1)
  const urgencyLevel = days_overdue > 60 ? 'urgent' : days_overdue > 30 ? 'firm' : 'soft'

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    max_tokens: 600,
    messages: [
      {
        role: 'system',
        content: `You are Nova, generating WhatsApp payment reminder messages for Indian businesses.
Write in natural Hinglish (Hindi + English mix) as if the business owner is writing personally.
Be warm, respectful, and culturally appropriate for Indian B2B relationships.
Return ONLY valid JSON. No markdown. No preamble.

Output format:
{
  "soft": "message text for gentle reminder",
  "firm": "message text for professional follow-up",
  "urgent": "message text for final notice"
}

Rules:
- Soft: Friendly, assumes good faith, short (2-3 lines)
- Firm: Professional, mentions specific amount and days, 3-4 lines
- Urgent: Direct, final warning tone (only for 30+ days)
- All messages: include amount
- Never use threatening language
- Sound like a real person, not a system notification`,
      },
      {
        role: 'user',
        content: `Generate 3 payment reminder messages for:
Customer: ${customer_name}
Amount: ₹${amountLakhs}L (₹${amount.toLocaleString('en-IN')})
Days overdue: ${days_overdue}
Urgency level: ${urgencyLevel}`,
      },
    ],
  })

  try {
    const raw = completion.choices[0]?.message?.content ?? '{}'
    const messages = JSON.parse(raw) as { soft: string; firm: string; urgent: string }
    return NextResponse.json({ messages, phone })
  } catch {
    return NextResponse.json({
      messages: {
        soft: `${customer_name} ji, aapka ₹${amountLakhs}L ka payment pending hai. Kya aaj settle ho sakta hai?`,
        firm: `${customer_name} bhai, invoice ka ₹${amountLakhs}L — ${days_overdue} din se pending hai. Please aaj payment confirm karein.`,
        urgent: `Final reminder: ${customer_name} ji, ₹${amountLakhs}L payment ${days_overdue} din se overdue hai. Aaj urgent attention chahiye.`,
      },
      phone,
    })
  }
}
