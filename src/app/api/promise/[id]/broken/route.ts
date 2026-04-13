import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payment_promises } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const promiseId = parseInt(id);
    if (isNaN(promiseId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    await db.update(payment_promises)
      .set({ status: "broken" })
      .where(eq(payment_promises.id, promiseId));

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
