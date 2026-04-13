export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payment_promises } from "@/db/schema";

export async function POST(req: NextRequest) {
  try {
    const { customer_id, invoice_id, promised_amount, promised_date, notes } = await req.json();
    if (!customer_id || !invoice_id || !promised_amount || !promised_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const ORG_ID = 1;
    const [promise] = await db
      .insert(payment_promises)
      .values({
        organization_id: ORG_ID,
        customer_id,
        invoice_id,
        promised_amount: promised_amount.toString(),
        promised_date,
        notes: notes || null,
        status: "pending",
      })
      .returning({ id: payment_promises.id });

    return NextResponse.json({ id: promise.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
