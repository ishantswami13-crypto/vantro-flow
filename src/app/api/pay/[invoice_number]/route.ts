export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, follow_ups } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ invoice_number: string }> }
) {
  try {
    const { invoice_number } = await params;
    
    if (!invoice_number) {
      return NextResponse.json({ error: "Invoice number is required" }, { status: 400 });
    }

    const [invoice] = await db.select().from(invoices).where(eq(invoices.invoice_number, invoice_number)).limit(1);
    
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status === "paid") {
      return NextResponse.json({ message: "Invoice already paid" }, { status: 200 });
    }

    // Set amount_paid to total amount and status to paid
    await db.update(invoices).set({
      amount_paid: invoice.amount,
      status: "paid",
      is_disputed: false,
    }).where(eq(invoices.id, invoice.id));

    // Log the automated payment in follow_ups
    await db.insert(follow_ups).values({
      organization_id: invoice.organization_id,
      customer_id: invoice.customer_id,
      invoice_id: invoice.id,
      activity_type: "payment",
      message_text: `Payment completed via Public Portal for ₹${invoice.amount}`,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
