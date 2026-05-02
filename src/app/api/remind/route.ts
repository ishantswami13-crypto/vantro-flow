export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers, invoices, follow_ups } from "@/db/schema";
import { eq } from "drizzle-orm";
import Groq from "groq-sdk";

export async function POST(req: NextRequest) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  try {
    const { customer_id, invoice_id, tone = "gentle" } = await req.json();
    if (!customer_id || !invoice_id) {
      return NextResponse.json({ error: "customer_id and invoice_id are required" }, { status: 400 });
    }

    const [customer] = await db.select().from(customers).where(eq(customers.id, customer_id)).limit(1);
    const [invoice] = await db.select({
      id: invoices.id,
      invoice_number: invoices.invoice_number,
      due_date: invoices.due_date,
      amount: invoices.amount,
      days_overdue: invoices.days_overdue,
    }).from(invoices).where(eq(invoices.id, invoice_id)).limit(1);

    if (!customer || !invoice) {
      return NextResponse.json({ error: "Account or invoice not found" }, { status: 404 });
    }

    const outstanding = parseFloat(invoice.amount);
    const formattedAmount = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(outstanding);

    const paymentLink = `http://${req.headers.get("host") || "localhost:3000"}/pay/${invoice.invoice_number}`;
    
    let toneInstruction = "Be calm, gentle, and polite.";
    if (tone === "firm") {
      toneInstruction = "Be firm, direct, and assert that the payment is overdue.";
    } else if (tone === "urgent") {
      toneInstruction = "Be urgent and strict. Emphasize that immediate action is required to avoid account disruption or legal escalation.";
    }

    const prompt = `You are a finance operations assistant for a modern company.
Write a short, professional payment reminder for the following account:

Account Name: ${customer.name}
Invoice Number: ${invoice.invoice_number}
Due Date: ${invoice.due_date}
Outstanding Amount: ${formattedAmount}
Days Overdue: ${invoice.days_overdue}

Guidelines:
- Keep it under 100 words
- Tone: ${toneInstruction}
- Avoid slang and emojis
- Include the invoice number and amount
- You MUST include this exact payment link at the end of the message so they can pay immediately: ${paymentLink}
- Make the message ready to send by email, chat, or SMS`;

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
    });
    const message = response.choices[0].message.content ?? "";

    await db.insert(follow_ups).values({
      organization_id: 1,
      customer_id,
      invoice_id,
      activity_type: "whatsapp",
      message_text: message,
    });

    return NextResponse.json({ message });
  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
