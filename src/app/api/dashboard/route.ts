export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { db } from "@/db";
import { customers, invoices, payment_promises } from "@/db/schema";
import { and, desc, eq, gt, ne, sql } from "drizzle-orm";

function formatDateInIST(date: Date) {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export async function GET() {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const today = formatDateInIST(now);
    const weekAheadDate = new Date(now);
    weekAheadDate.setDate(weekAheadDate.getDate() + 7);
    const weekAhead = formatDateInIST(weekAheadDate);

    const [pendingInvoices, paidInvoices, allInvoices, activeCustomerRows] = await Promise.all([
      db.select({ amount: invoices.amount }).from(invoices).where(ne(invoices.status, "paid")),
      db
        .select({ amount: invoices.amount, created_at: invoices.created_at })
        .from(invoices)
        .where(eq(invoices.status, "paid")),
      db.select({ id: invoices.id }).from(invoices),
      db
        .select({ customer_id: invoices.customer_id })
        .from(invoices)
        .where(ne(invoices.status, "paid"))
        .groupBy(invoices.customer_id),
    ]);

    const totalOutstanding = pendingInvoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0);
    const collectedThisMonth = paidInvoices
      .filter((invoice) => invoice.created_at && new Date(invoice.created_at) >= monthStart)
      .reduce((sum, invoice) => sum + Number(invoice.amount), 0);
    const collectionRate =
      allInvoices.length > 0 ? Math.round((paidInvoices.length / allInvoices.length) * 100) : 0;

    const agingRows = await db
      .select({
        bucket: invoices.aging_bucket,
        total: sql<number>`COALESCE(SUM(${invoices.amount}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(invoices)
      .where(ne(invoices.status, "paid"))
      .groupBy(invoices.aging_bucket);

    const followUpRows = await db
      .select({
        id: invoices.id,
        customerId: customers.id,
        customerName: customers.name,
        invoiceNumber: invoices.invoice_number,
        amount: invoices.amount,
        amountPaid: invoices.amount_paid,
        daysOverdue: invoices.days_overdue,
        dueDate: invoices.due_date,
      })
      .from(invoices)
      .innerJoin(customers, eq(invoices.customer_id, customers.id))
      .where(and(gt(invoices.days_overdue, 7), ne(invoices.status, "paid")))
      .orderBy(desc(invoices.days_overdue))
      .limit(10);

    const promisesToday = await db
      .select({
        id: payment_promises.id,
        customer_name: customers.name,
        customer_id: customers.id,
        promised_amount: payment_promises.promised_amount,
        promised_date: payment_promises.promised_date,
        notes: payment_promises.notes,
        invoice_number: invoices.invoice_number,
      })
      .from(payment_promises)
      .innerJoin(customers, eq(payment_promises.customer_id, customers.id))
      .innerJoin(invoices, eq(payment_promises.invoice_id, invoices.id))
      .where(and(eq(payment_promises.promised_date, today), eq(payment_promises.status, "pending")))
      .orderBy(desc(payment_promises.promised_amount));

    const [forecastRow] = await db
      .select({
        expected_this_week: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.due_date} >= ${today} AND ${invoices.due_date} <= ${weekAhead} AND ${invoices.status} != 'paid' THEN ${invoices.amount} ELSE 0 END), 0)`,
        overdue_risk: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.days_overdue} > 0 AND ${invoices.status} != 'paid' THEN ${invoices.amount} ELSE 0 END), 0)`,
      })
      .from(invoices);

    const [promisesWeekRow] = await db
      .select({
        promises_this_week: sql<number>`COALESCE(SUM(${payment_promises.promised_amount}), 0)`,
      })
      .from(payment_promises)
      .where(
        and(
          sql`${payment_promises.promised_date} >= ${today}`,
          sql`${payment_promises.promised_date} <= ${weekAhead}`,
          eq(payment_promises.status, "pending")
        )
      );

    const chartRows = await db
      .select({
        day: sql<string>`DATE(${invoices.created_at})::text`,
        total: sql<number>`COALESCE(SUM(${invoices.amount}), 0)`,
      })
      .from(invoices)
      .where(sql`${invoices.created_at} >= NOW() - INTERVAL '7 days'`)
      .groupBy(sql`DATE(${invoices.created_at})`)
      .orderBy(sql`DATE(${invoices.created_at})`);

    const last7Dates = Array.from({ length: 7 }, (_, index) => {
      const current = new Date(now);
      current.setDate(now.getDate() - (6 - index));
      return formatDateInIST(current);
    });

    const last7Days = last7Dates.map((day) => ({
      date: day,
      amount: Number(chartRows.find((row) => row.day === day)?.total ?? 0),
    }));

    function getBucket(bucket: string) {
      const row = agingRows.find((entry) => entry.bucket === bucket);
      return {
        amount: Number(row?.total ?? 0),
        count: Number(row?.count ?? 0),
      };
    }

    const agingBuckets = {
      current: getBucket("current"),
      aging1to30: getBucket("1-30"),
      aging31to60: getBucket("31-60"),
      aging60plus: getBucket("60+"),
    };

    const weekForecast = {
      expectedThisWeek: Number(forecastRow.expected_this_week),
      promisesDue: Number(promisesWeekRow.promises_this_week),
      overdueRisk: Number(forecastRow.overdue_risk),
    };

    const chartLabels = last7Days.map((item) =>
      new Date(`${item.date}T12:00:00+05:30`).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      })
    );
    const chartData = last7Days.map((item) => item.amount);

    return NextResponse.json({
      totalOutstanding,
      collectedThisMonth,
      activeCustomers: activeCustomerRows.length,
      collectionRate,
      agingBuckets,
      followUpList: followUpRows,
      weekForecast,
      last7Days,
      followUpCount: followUpRows.length,
      current: agingBuckets.current.amount,
      currentCount: agingBuckets.current.count,
      aging1to30: agingBuckets.aging1to30.amount,
      aging1to30Count: agingBuckets.aging1to30.count,
      aging31to60: agingBuckets.aging31to60.amount,
      aging31to60Count: agingBuckets.aging31to60.count,
      aging60plus: agingBuckets.aging60plus.amount,
      aging60plusCount: agingBuckets.aging60plus.count,
      followUps: followUpRows.map((row) => ({
        invoice_id: row.id,
        customer_id: row.customerId,
        customer_name: row.customerName,
        invoice_number: row.invoiceNumber,
        amount: row.amount,
        amount_paid: row.amountPaid,
        days_overdue: row.daysOverdue,
        due_date: row.dueDate,
      })),
      promisesToday,
      expectedThisWeek: weekForecast.expectedThisWeek,
      promisesThisWeek: weekForecast.promisesDue,
      overdueRisk: weekForecast.overdueRisk,
      chartData,
      chartLabels,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
