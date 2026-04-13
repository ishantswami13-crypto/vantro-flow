import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { follow_ups } from "@/db/schema";

export async function POST(req: NextRequest) {
  try {
    const { customer_id, invoice_id, message_text } = await req.json();
    if (!customer_id || !message_text?.trim()) {
      return NextResponse.json({ error: "customer_id and message_text are required" }, { status: 400 });
    }

    const [record] = await db
      .insert(follow_ups)
      .values({
        organization_id: 1,
        customer_id,
        invoice_id: invoice_id ?? null,
        activity_type: "note",
        message_text: message_text.trim(),
      })
      .returning({ id: follow_ups.id });

    return NextResponse.json({ id: record.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
