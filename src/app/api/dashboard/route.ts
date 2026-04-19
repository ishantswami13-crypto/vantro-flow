export const dynamic = "force-dynamic";

import { neon } from "@neondatabase/serverless";
import { getDefaultOrganizationProfile } from "@/lib/organization-profile";

type InvoiceRow = {
  id: number;
  customer_id: number | null;
  invoice_number: string;
  invoice_date: string | null;
  due_date: string | null;
  amount: string | number | null;
  amount_paid: string | number | null;
  status: string | null;
  days_overdue: number | null;
};

type CustomerRow = {
  id: number;
  name: string;
};

type PromiseRow = {
  promised_amount: string | number | null;
  promised_date: string | null;
  status: string | null;
};

function toNumber(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return value;
  }

  if (!value) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!);

  try {
    const organization = await getDefaultOrganizationProfile();
    const orgId = organization.id;

    const [invoices, customers, paymentPromises] = (await Promise.all([
      sql`
        SELECT
          id,
          customer_id,
          invoice_number,
          invoice_date,
          due_date,
          amount,
          amount_paid,
          status,
          days_overdue
        FROM invoices
        WHERE organization_id = ${orgId}
      `,
      sql`
        SELECT id, name
        FROM customers
        WHERE organization_id = ${orgId}
      `,
      sql`
        SELECT promised_amount, promised_date, status
        FROM payment_promises
        WHERE organization_id = ${orgId}
      `,
    ])) as [InvoiceRow[], CustomerRow[], PromiseRow[]];

    const customerMap = new Map(customers.map((customer) => [customer.id, customer.name]));
    const pending = invoices.filter((invoice) => invoice.status !== "paid");
    const paid = invoices.filter((invoice) => invoice.status === "paid");

    const totalOutstanding = pending.reduce((sum, invoice) => {
      const outstanding = Math.max(toNumber(invoice.amount) - toNumber(invoice.amount_paid), 0);
      return sum + outstanding;
    }, 0);

    const collectedThisMonth = paid.reduce((sum, invoice) => {
      const collected = toNumber(invoice.amount_paid) || toNumber(invoice.amount);
      return sum + collected;
    }, 0);

    const activeCustomers = new Set(
      pending.map((invoice) => invoice.customer_id).filter((customerId): customerId is number => customerId !== null)
    ).size;

    const collectionRate = invoices.length > 0 ? Math.round((paid.length / invoices.length) * 100) : 0;

    const today = startOfDay(new Date());
    const followUpList = pending
      .map((invoice) => {
        const dueDate = invoice.due_date ? new Date(invoice.due_date) : null;
        const derivedDaysOverdue = dueDate
          ? Math.max(0, Math.floor((today.getTime() - startOfDay(dueDate).getTime()) / 86400000))
          : 0;

        return {
          id: invoice.id,
          customerId: invoice.customer_id ?? invoice.id,
          customerName: customerMap.get(invoice.customer_id ?? -1) ?? "Unknown",
          invoiceNumber: invoice.invoice_number,
          amount: toNumber(invoice.amount),
          amountPaid: toNumber(invoice.amount_paid),
          dueDate: invoice.due_date,
          daysOverdue: invoice.days_overdue ?? derivedDaysOverdue,
        };
      })
      .filter((invoice) => (invoice.daysOverdue ?? 0) > 7)
      .sort((left, right) => (right.daysOverdue ?? 0) - (left.daysOverdue ?? 0))
      .slice(0, 10);

    const agingBuckets = {
      current: { amount: 0, count: 0 },
      aging1to30: { amount: 0, count: 0 },
      aging31to60: { amount: 0, count: 0 },
      aging60plus: { amount: 0, count: 0 },
    };

    pending.forEach((invoice) => {
      const outstanding = Math.max(toNumber(invoice.amount) - toNumber(invoice.amount_paid), 0);
      const daysOverdue = Number(invoice.days_overdue ?? 0);

      if (daysOverdue <= 0) {
        agingBuckets.current.amount += outstanding;
        agingBuckets.current.count += 1;
        return;
      }

      if (daysOverdue <= 30) {
        agingBuckets.aging1to30.amount += outstanding;
        agingBuckets.aging1to30.count += 1;
        return;
      }

      if (daysOverdue <= 60) {
        agingBuckets.aging31to60.amount += outstanding;
        agingBuckets.aging31to60.count += 1;
        return;
      }

      agingBuckets.aging60plus.amount += outstanding;
      agingBuckets.aging60plus.count += 1;
    });

    const nextWeekStart = today.getTime();
    const nextWeekEnd = startOfDay(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7)).getTime();

    const expectedThisWeek = pending.reduce((sum, invoice) => {
      if (!invoice.due_date) {
        return sum;
      }

      const dueTime = startOfDay(new Date(invoice.due_date)).getTime();
      if (dueTime < nextWeekStart || dueTime > nextWeekEnd) {
        return sum;
      }

      return sum + Math.max(toNumber(invoice.amount) - toNumber(invoice.amount_paid), 0);
    }, 0);

    const promisesDue = paymentPromises.reduce((sum, promise) => {
      if (promise.status && promise.status !== "pending") {
        return sum;
      }

      if (!promise.promised_date) {
        return sum;
      }

      const promisedTime = startOfDay(new Date(promise.promised_date)).getTime();
      if (promisedTime < nextWeekStart || promisedTime > nextWeekEnd) {
        return sum;
      }

      return sum + toNumber(promise.promised_amount);
    }, 0);

    const last7Dates = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - 6 + index);
      return toIsoDate(date);
    });

    const last7DaysMap = new Map(last7Dates.map((date) => [date, 0]));
    pending.forEach((invoice) => {
      const key = invoice.due_date ?? invoice.invoice_date;
      if (!key || !last7DaysMap.has(key)) {
        return;
      }

      const nextValue = last7DaysMap.get(key)! + Math.max(toNumber(invoice.amount) - toNumber(invoice.amount_paid), 0);
      last7DaysMap.set(key, nextValue);
    });

    const last7Days = last7Dates.map((date) => ({
      date,
      amount: last7DaysMap.get(date) ?? 0,
    }));

    return Response.json({
      totalOutstanding,
      collectedThisMonth,
      activeCustomers,
      collectionRate,
      organization: {
        name: organization.name,
        companyScale: organization.companyScale,
        selectedModules: organization.selectedModules,
      },
      followUpList,
      agingBuckets,
      weekForecast: {
        expectedThisWeek,
        promisesDue,
        overdueRisk: agingBuckets.aging60plus.amount,
      },
      last7Days,
    });
  } catch (error) {
    console.error("[api/dashboard] failed", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}

