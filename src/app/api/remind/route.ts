import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers, invoices, follow_ups } from "@/db/schema";
import { eq } from "drizzle-orm";
import Groq from "groq-sdk";

export async function POST(req: NextRequest) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  try {
    const { customer_id, invoice_id } = await req.json();
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
      return NextResponse.json({ error: "Customer or invoice not found" }, { status: 404 });
    }

    const outstanding = parseFloat(invoice.amount);
    const formattedAmount = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(outstanding);

    const prompt = `You are a collections assistant for an Indian MSME business.
Write a short, friendly WhatsApp reminder message in Hinglish (mix of Hindi and English) for the following:

Customer Name: ${customer.name}
Invoice Number: ${invoice.invoice_number}
Due Date: ${invoice.due_date}
Outstanding Amount: ${formattedAmount}
Days Overdue: ${invoice.days_overdue}

Guidelines:
- Keep it under 100 words
- Be polite and professional, not threatening
- Use Hinglish naturally (like "bhai", "please", "payment", "invoice")
- Include the invoice number and amount
- End with a request to pay or confirm payment timeline
- Do NOT use emojis excessively, max 1-2
- Do NOT start with "Hi" or "Hello", start directly with the customer name`;

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
