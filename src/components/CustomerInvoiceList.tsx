"use client";

import { useState } from "react";
import InvoiceActions from "./InvoiceActions";

interface Invoice {
  id: number;
  invoice_number: string;
  invoice_date: string | null;
  due_date: string | null;
  amount: string;
  amount_paid: string | null;
  days_overdue: number | null;
  status: string | null;
}

interface Props {
  customerId: number;
  invoices: Invoice[];
}

function formatCurrency(value: number | string | null) {
  if (value === null) {
    return "-";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(typeof value === "string" ? Number.parseFloat(value) : value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  const [year, month, day] = value.split("-").map(Number);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${day} ${monthNames[month - 1]} ${year}`;
}

function getStatusConfig(status: string | null, isPaid: boolean) {
  if (isPaid || status === "paid") {
    return {
      label: "Paid",
      badgeBackground: "var(--sage-light)",
      badgeColor: "var(--sage)",
    };
  }

  if (status === "overdue") {
    return {
      label: "Overdue",
      badgeBackground: "var(--coral-light)",
      badgeColor: "var(--coral)",
    };
  }

  return {
    label: "Open",
    badgeBackground: "var(--amber-light)",
    badgeColor: "var(--amber)",
  };
}

export default function CustomerInvoiceList({ customerId, invoices }: Props) {
  const [paidIds, setPaidIds] = useState<Set<number>>(new Set());

  if (invoices.length === 0) {
    return (
      <div
        className="rounded-[28px] p-10 text-center"
        style={{ background: "white", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
      >
        <p className="text-lg font-semibold" style={{ fontFamily: "var(--font-syne, 'Bricolage Grotesque')" }}>
          No invoices found
        </p>
        <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
          Upload a CSV or create an invoice from the top navigation.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {invoices.map((invoice) => {
          const isPaid = paidIds.has(invoice.id) || invoice.status === "paid";
          const outstanding = Math.max(
            Number.parseFloat(invoice.amount) - Number.parseFloat(invoice.amount_paid ?? "0"),
            0
          );
          const status = getStatusConfig(invoice.status, isPaid);

          return (
            <div
              key={invoice.id}
              className="rounded-[24px] p-4"
              style={{ background: "white", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-bold" style={{ fontFamily: "var(--font-syne, 'Bricolage Grotesque')" }}>
                    {invoice.invoice_number}
                  </p>
                  <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
                    Issued {formatDate(invoice.invoice_date)} · Due {formatDate(invoice.due_date)}
                  </p>
                </div>
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{ background: status.badgeBackground, color: status.badgeColor }}
                >
                  {status.label}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-4)" }}>
                    Outstanding
                  </p>
                  <p className="mt-1 text-lg font-bold" style={{ fontFamily: "var(--font-syne, 'Bricolage Grotesque')" }}>
                    {formatCurrency(outstanding)}
                  </p>
                </div>
                {!isPaid ? (
                  <InvoiceActions
                    customerId={customerId}
                    invoiceId={invoice.id}
                    amount={outstanding}
                    onPaid={() => setPaidIds((current) => new Set(current).add(invoice.id))}
                  />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="hidden overflow-hidden rounded-[28px] md:block"
        style={{ background: "white", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr style={{ background: "var(--bg-surface-2)" }}>
                {["Invoice", "Issue Date", "Due Date", "Outstanding", "Status", "Actions"].map((heading) => (
                  <th
                    key={heading}
                    className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em]"
                    style={{ color: "var(--text-4)" }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => {
                const isPaid = paidIds.has(invoice.id) || invoice.status === "paid";
                const outstanding = Math.max(
                  Number.parseFloat(invoice.amount) - Number.parseFloat(invoice.amount_paid ?? "0"),
                  0
                );
                const status = getStatusConfig(invoice.status, isPaid);

                return (
                  <tr key={invoice.id}>
                    <td className="border-t border-[#F1F1F3] px-5 py-4">
                      <div className="font-semibold" style={{ fontFamily: "var(--font-syne, 'Bricolage Grotesque')" }}>
                        {invoice.invoice_number}
                      </div>
                      {invoice.days_overdue && !isPaid ? (
                        <div className="mt-1 text-xs" style={{ color: "var(--coral)" }}>
                          {invoice.days_overdue} days overdue
                        </div>
                      ) : null}
                    </td>
                    <td className="border-t border-[#F1F1F3] px-5 py-4" style={{ color: "var(--text-2)" }}>
                      {formatDate(invoice.invoice_date)}
                    </td>
                    <td className="border-t border-[#F1F1F3] px-5 py-4" style={{ color: "var(--text-2)" }}>
                      {formatDate(invoice.due_date)}
                    </td>
                    <td className="border-t border-[#F1F1F3] px-5 py-4">
                      <div className="font-bold" style={{ fontFamily: "var(--font-syne, 'Bricolage Grotesque')" }}>
                        {formatCurrency(outstanding)}
                      </div>
                      <div className="mt-1 text-xs" style={{ color: "var(--text-4)" }}>
                        of {formatCurrency(invoice.amount)}
                      </div>
                    </td>
                    <td className="border-t border-[#F1F1F3] px-5 py-4">
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{ background: status.badgeBackground, color: status.badgeColor }}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="border-t border-[#F1F1F3] px-5 py-4">
                      {!isPaid ? (
                        <InvoiceActions
                          customerId={customerId}
                          invoiceId={invoice.id}
                          amount={outstanding}
                          onPaid={() => setPaidIds((current) => new Set(current).add(invoice.id))}
                        />
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
