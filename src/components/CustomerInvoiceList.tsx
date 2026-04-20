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
  if (value === null) return "-";
  const n = typeof value === "string" ? Number.parseFloat(value) : value;
  return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n || 0)}`;
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
      badgeBackground: "var(--success-soft)",
      badgeColor: "var(--success)",
    };
  }

  if (status === "overdue") {
    return {
      label: "Overdue",
      badgeBackground: "var(--danger-soft)",
      badgeColor: "var(--danger)",
    };
  }

  return {
    label: "Open",
    badgeBackground: "var(--warning-soft)",
    badgeColor: "var(--warning)",
  };
}

export default function CustomerInvoiceList({ customerId, invoices }: Props) {
  const [paidIds, setPaidIds] = useState<Set<number>>(new Set());

  if (invoices.length === 0) {
    return (
      <div className="linear-panel rounded-[22px] px-6 py-12 text-center">
        <p className="text-base font-semibold tracking-[-0.02em]">No invoices found</p>
        <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
          Upload a CSV or create the first invoice to start collections.
        </p>
      </div>
    );
  }

  const outstandingInvoices = invoices.filter(
    (invoice) => !paidIds.has(invoice.id) && invoice.status !== "paid"
  );
  const overdueInvoices = outstandingInvoices.filter((invoice) => Number(invoice.days_overdue ?? 0) > 0);
  const totalOutstanding = outstandingInvoices.reduce(
    (sum, invoice) => sum + Math.max(Number.parseFloat(invoice.amount) - Number.parseFloat(invoice.amount_paid ?? "0"), 0),
    0
  );

  return (
    <div className="linear-panel overflow-hidden rounded-[22px]">
      <div
        className="flex flex-col gap-3 border-b px-4 py-4 sm:px-5"
        style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.03em]">Invoice ledger</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
              Review due dates, outstanding amounts, and reminder actions in one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="linear-tag">{outstandingInvoices.length} open</span>
            <span className="linear-tag">{overdueInvoices.length} overdue</span>
            <span className="linear-tag">{formatCurrency(totalOutstanding)} outstanding</span>
          </div>
        </div>
      </div>

      <div className="md:hidden">
        {invoices.map((invoice, index) => {
          const isPaid = paidIds.has(invoice.id) || invoice.status === "paid";
          const outstanding = Math.max(
            Number.parseFloat(invoice.amount) - Number.parseFloat(invoice.amount_paid ?? "0"),
            0
          );
          const status = getStatusConfig(invoice.status, isPaid);

          return (
            <div
              key={invoice.id}
              className={index === 0 ? "px-4 py-4" : "border-t px-4 py-4"}
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold tracking-[-0.02em]">{invoice.invoice_number}</p>
                  <p className="mt-1 text-xs" style={{ color: "var(--text-3)" }}>
                    Issued {formatDate(invoice.invoice_date)} | Due {formatDate(invoice.due_date)}
                  </p>
                </div>
                <span
                  className="linear-badge"
                  style={{ background: status.badgeBackground, color: status.badgeColor }}
                >
                  {status.label}
                </span>
              </div>

              <div className="mt-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-4)" }}>
                    Outstanding
                  </p>
                  <p className="mt-1 text-base font-semibold tracking-[-0.02em]">{formatCurrency(outstanding)}</p>
                  <p className="mt-1 text-xs" style={{ color: "var(--text-4)" }}>
                    Total {formatCurrency(invoice.amount)}
                  </p>
                  {invoice.days_overdue && !isPaid ? (
                    <p className="mt-2 text-xs font-medium" style={{ color: "var(--danger)" }}>
                      {invoice.days_overdue} days overdue
                    </p>
                  ) : null}
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

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full table-fixed border-separate border-spacing-0 text-sm">
          <thead>
            <tr style={{ background: "var(--bg-surface-2)" }}>
              {[
                ["Invoice", "26%"],
                ["Issue date", "14%"],
                ["Due date", "14%"],
                ["Outstanding", "18%"],
                ["Status", "12%"],
                ["Actions", "16%"],
              ].map(([heading, width]) => (
                <th
                  key={heading}
                  className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: "var(--text-4)", width }}
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
                <tr key={invoice.id} className="align-top">
                  <td className="border-t px-5 py-3.5" style={{ borderColor: "var(--border)" }}>
                    <div className="font-semibold tracking-[-0.02em]">{invoice.invoice_number}</div>
                    <div className="mt-1 text-xs" style={{ color: "var(--text-4)" }}>
                      {invoice.days_overdue && !isPaid ? `${invoice.days_overdue} days overdue` : "Invoice record"}
                    </div>
                  </td>
                  <td className="border-t px-5 py-3.5" style={{ color: "var(--text-2)", borderColor: "var(--border)" }}>
                    {formatDate(invoice.invoice_date)}
                  </td>
                  <td className="border-t px-5 py-3.5" style={{ color: "var(--text-2)", borderColor: "var(--border)" }}>
                    {formatDate(invoice.due_date)}
                  </td>
                  <td className="border-t px-5 py-3.5" style={{ borderColor: "var(--border)" }}>
                    <div className="font-semibold tracking-[-0.02em]">{formatCurrency(outstanding)}</div>
                    <div className="mt-1 text-xs" style={{ color: "var(--text-4)" }}>
                      of {formatCurrency(invoice.amount)}
                    </div>
                  </td>
                  <td className="border-t px-5 py-3.5" style={{ borderColor: "var(--border)" }}>
                    <span
                      className="linear-badge"
                      style={{ background: status.badgeBackground, color: status.badgeColor }}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="border-t px-5 py-3.5" style={{ borderColor: "var(--border)" }}>
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
  );
}
