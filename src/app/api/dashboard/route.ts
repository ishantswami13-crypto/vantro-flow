import { db } from "@/db";
import { invoices, customers } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const allInvoices = await db.select().from(invoices);
    const allCustomers = await db.select().from(customers);

    const pending = allInvoices.filter((i) => i.status !== "paid");
    const paid = allInvoices.filter((i) => i.status === "paid");

    const totalOutstanding = pending.reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const collectedThisMonth = paid.reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const activeCustomers = new Set(pending.map((i) => i.customer_id)).size;
    const collectionRate =
      allInvoices.length > 0 ? Math.round((paid.length / allInvoices.length) * 100) : 0;

    const today = new Date();

    const followUpList = pending
      .map((inv) => {
        const dueDateStr = inv.due_date;
        const dueDate = dueDateStr ? new Date(dueDateStr) : today;
        const daysOverdue = Math.floor(
          (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const customer = allCustomers.find((c) => c.id === inv.customer_id);
        return {
          id: inv.id,
          customerName: customer?.name || "Unknown",
          invoiceNumber: inv.invoice_number,
          amount: Number(inv.amount || 0),
          dueDate: inv.due_date,
          daysOverdue: Math.max(0, daysOverdue),
          customerId: inv.customer_id,
        };
      })
      .filter((i) => i.daysOverdue > 7)
      .sort((a, b) => b.daysOverdue - a.daysOverdue)
      .slice(0, 10);

    const agingBuckets = {
      current: { amount: 0, count: 0 },
      aging1to30: { amount: 0, count: 0 },
      aging31to60: { amount: 0, count: 0 },
      aging60plus: { amount: 0, count: 0 },
    };

    pending.forEach((inv) => {
      const dueDateStr = inv.due_date;
      const dueDate = dueDateStr ? new Date(dueDateStr) : today;
      const days = Math.floor(
        (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const amt = Number(inv.amount || 0);
      if (days <= 0) {
        agingBuckets.current.amount += amt;
        agingBuckets.current.count++;
      } else if (days <= 30) {
        agingBuckets.aging1to30.amount += amt;
        agingBuckets.aging1to30.count++;
      } else if (days <= 60) {
        agingBuckets.aging31to60.amount += amt;
        agingBuckets.aging31to60.count++;
      } else {
        agingBuckets.aging60plus.amount += amt;
        agingBuckets.aging60plus.count++;
      }
    });

    return Response.json({
      totalOutstanding,
      collectedThisMonth,
      activeCustomers,
      collectionRate,
      followUpList,
      agingBuckets,
      weekForecast: {
        expectedThisWeek: 0,
        promisesDue: 0,
        overdueRisk: agingBuckets.aging60plus.amount,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
