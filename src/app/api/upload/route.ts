import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers, invoices } from "@/db/schema";
import { eq, and } from "drizzle-orm";

function agingBucket(daysOverdue: number): string {
  if (daysOverdue <= 0) return "current";
  if (daysOverdue <= 30) return "1-30";
  if (daysOverdue <= 60) return "31-60";
  return "60+";
}

export async function POST(req: NextRequest) {
  try {
    const { rows } = await req.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No rows provided" }, { status: 400 });
    }

    const ORG_ID = 1; // default org
    let imported = 0;
    let customers_created = 0;

    for (const row of rows) {
      const { customer_name, phone, invoice_number, invoice_date, due_date, amount } = row;
      if (!customer_name || !phone || !invoice_number || !amount) continue;

      // Upsert customer
      let existingCustomer = await db
        .select({ id: customers.id })
        .from(customers)
        .where(and(eq(customers.phone, phone), eq(customers.organization_id, ORG_ID)))
        .limit(1);

      let customerId: number;
      if (existingCustomer.length === 0) {
        const inserted = await db
          .insert(customers)
          .values({
            organization_id: ORG_ID,
            name: customer_name,
            phone,
          })
          .returning({ id: customers.id });
        customerId = inserted[0].id;
        customers_created++;
      } else {
        customerId = existingCustomer[0].id;
      }

      // Calculate days overdue
      const today = new Date();
      const dueDateObj = due_date ? new Date(due_date) : null;
      const daysOverdue = dueDateObj
        ? Math.max(0, Math.floor((today.getTime() - dueDateObj.getTime()) / 86400000))
        : 0;

      await db.insert(invoices).values({
        organization_id: ORG_ID,
        customer_id: customerId,
        invoice_number,
        invoice_date: invoice_date || null,
        due_date: due_date || null,
        amount: amount.toString(),
        days_overdue: daysOverdue,
        aging_bucket: agingBucket(daysOverdue),
        status: daysOverdue > 0 ? "overdue" : "unpaid",
      });

      imported++;
    }

    return NextResponse.json({ imported, customers_created });
  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
