import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payment_promises, invoices } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const promiseId = parseInt(id);
    if (isNaN(promiseId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const [promise] = await db
      .select()
      .from(payment_promises)
      .where(eq(payment_promises.id, promiseId))
      .limit(1);

    if (!promise) return NextResponse.json({ error: "Promise not found" }, { status: 404 });

    await Promise.all([
      db.update(payment_promises)
        .set({ status: "fulfilled" })
        .where(eq(payment_promises.id, promiseId)),
      db.update(invoices)
        .set({ status: "paid" })
        .where(eq(invoices.id, promise.invoice_id!)),
    ]);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
