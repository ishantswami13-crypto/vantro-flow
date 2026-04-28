"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";

interface Customer {
  id: number;
  name: string;
  phone: string;
  city: string | null;
  total_outstanding: number;
  invoice_count: number;
}

interface Props {
  customers: Customer[];
}

const AVATAR_COLORS = ["#0A8F84", "#067A70", "#D64045", "#2D8B4E", "#C4841D", "#E87B35"];

function formatCurrency(value: number | string) {
  const n = typeof value === "string" ? Number.parseFloat(value) : value;
  return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n || 0)}`;
}

function getAvatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
}

export default function CustomerList({ customers }: Props) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const filteredCustomers = normalizedQuery
    ? customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(normalizedQuery) || customer.phone.includes(deferredQuery.trim())
      )
    : customers;

  const maxOutstanding = Math.max(...customers.map((customer) => Number(customer.total_outstanding)), 1);
  const filteredOutstanding = filteredCustomers.reduce((sum, customer) => sum + Number(customer.total_outstanding), 0);

  return (
    <div className="space-y-4">
      <div className="surface-panel rounded-[22px] px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <label className="relative block w-full max-w-[560px]">
            <span className="sr-only">Search accounts</span>
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              style={{ color: "var(--text-3)" }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35" />
              <circle cx="11" cy="11" r="6" />
            </svg>
            <input
              aria-label="Search accounts"
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search accounts by name or phone"
              className="apple-input h-11 w-full rounded-[14px] bg-[var(--bg-base)] py-2.5 pl-10 pr-4 text-sm"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <span className="linear-tag">
              {filteredCustomers.length} of {customers.length} accounts
            </span>
            <span className="linear-tag">Open balance {formatCurrency(filteredOutstanding)}</span>
          </div>
        </div>
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="surface-panel fade-up rounded-[22px] px-6 py-14 text-center">
          <p className="mb-2 text-base font-semibold tracking-normal">No accounts match this search</p>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>
            Try a phone number or shorten the company name.
          </p>
        </div>
      ) : (
        <div className="linear-panel fade-up overflow-hidden rounded-[22px]">
          <div
            className="hidden lg:grid lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.35fr)_120px_180px_84px] lg:gap-4 lg:border-b lg:px-5 lg:py-3"
            style={{ borderColor: "var(--border)", background: "var(--bg-surface-2)" }}
          >
            {["Account", "Contact", "Invoices", "Outstanding", "View"].map((heading) => (
              <div
                key={heading}
                className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: "var(--text-4)" }}
              >
                {heading}
              </div>
            ))}
          </div>

          <div>
            {filteredCustomers.map((customer, index) => {
              const color = getAvatarColor(customer.name);
              const outstanding = Number(customer.total_outstanding);
              const progress = Math.max((outstanding / maxOutstanding) * 100, outstanding > 0 ? 6 : 0);

              return (
                <div
                  key={customer.id}
                  className={index === 0 ? "fade-up-1" : `fade-up-${Math.min(index + 1, 5)}`}
                  style={{ borderColor: "var(--border)" }}
                >
                  <Link
                    href={`/customers/${customer.id}`}
                    className="group hidden items-center gap-4 px-5 py-3.5 transition-colors duration-150 hover:bg-[var(--bg-surface-2)] lg:grid lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.35fr)_120px_180px_84px]"
                    style={{ borderTop: index === 0 ? "none" : "1px solid var(--border)" }}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-xs font-semibold"
                        style={{
                          background: `${color}16`,
                          color,
                          border: `1px solid ${color}20`,
                        }}
                      >
                        {initials(customer.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold tracking-normal">{customer.name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--text-3)" }}>
                          {customer.city ? <span>{customer.city}</span> : <span>No city tagged</span>}
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm" style={{ color: "var(--text-2)" }}>
                        {customer.phone}
                      </p>
                      <p className="mt-1 text-xs" style={{ color: "var(--text-4)" }}>
                        Primary contact
                      </p>
                    </div>

                    <div className="text-sm font-semibold tracking-normal" style={{ color: "var(--text-1)" }}>
                      {customer.invoice_count}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold tracking-normal" style={{ color: "var(--text-1)" }}>
                        {formatCurrency(outstanding)}
                      </p>
                      <div className="mt-2 h-1.5 rounded-full" style={{ background: "var(--bg-surface-3)" }}>
                        <div
                          className="h-full rounded-full transition-[width] duration-500 ease-out"
                          style={{ background: color, width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div
                      className="inline-flex items-center justify-start text-sm font-medium transition-transform duration-150 group-hover:translate-x-0.5"
                      style={{ color: "var(--accent)" }}
                    >
                      Open
                    </div>
                  </Link>

                  <Link
                    href={`/customers/${customer.id}`}
                    className="group block px-4 py-4 transition-colors duration-150 hover:bg-[var(--bg-surface-2)] lg:hidden"
                    style={{ borderTop: index === 0 ? "none" : "1px solid var(--border)" }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-xs font-semibold"
                          style={{
                            background: `${color}16`,
                            color,
                            border: `1px solid ${color}20`,
                          }}
                        >
                          {initials(customer.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold tracking-normal">{customer.name}</p>
                          <p className="mt-1 truncate text-xs" style={{ color: "var(--text-3)" }}>
                            {customer.phone}
                            {customer.city ? ` | ${customer.city}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-medium uppercase tracking-[0.16em]" style={{ color: "var(--text-4)" }}>
                          Outstanding
                        </p>
                        <p className="mt-1 text-sm font-semibold tracking-normal">{formatCurrency(outstanding)}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-3)" }}>
                          <span>{customer.invoice_count} invoices</span>
                          <span>Open profile</span>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full" style={{ background: "var(--bg-surface-3)" }}>
                          <div
                            className="h-full rounded-full transition-[width] duration-500 ease-out"
                            style={{ background: color, width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
