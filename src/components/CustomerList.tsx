"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

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

const AVATAR_COLORS = ["#0A8F84", "#7C3AED", "#D97706", "#E5354A", "#059669", "#0EA5E9", "#EC4899", "#14B8A6"];

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(typeof value === "string" ? Number.parseFloat(value) : value);
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

  const filteredCustomers = query.trim()
    ? customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(query.toLowerCase()) || customer.phone.includes(query.trim())
      )
    : customers;

  const maxOutstanding = Math.max(...customers.map((customer) => Number(customer.total_outstanding)), 1);

  return (
    <div>
      <div className="relative mb-5">
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          style={{ color: "var(--text-3)" }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35" />
          <circle cx="11" cy="11" r="6" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search customers by name or phone..."
          className="w-full rounded-2xl py-3 pr-4 pl-11 text-sm outline-none transition-all"
          style={{
            background: "rgba(255,255,255,0.88)",
            border: "1px solid var(--border)",
            color: "var(--text-1)",
            boxShadow: "var(--shadow-sm)",
          }}
        />
      </div>

      <AnimatePresence mode="wait">
        {filteredCustomers.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="rounded-[28px] p-12 text-center"
            style={{
              background: "white",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <p className="mb-2 text-lg font-semibold" style={{ fontFamily: "var(--font-syne, 'Bricolage Grotesque')" }}>
              No customers match this search
            </p>
            <p style={{ color: "var(--text-3)" }}>Try a phone number or a shorter company name.</p>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {filteredCustomers.map((customer, index) => {
              const color = getAvatarColor(customer.name);
              const outstanding = Number(customer.total_outstanding);
              const progress = Math.max((outstanding / maxOutstanding) * 100, outstanding > 0 ? 4 : 0);

              return (
                <motion.div
                  key={customer.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={{ x: 4 }}
                >
                  <Link
                    href={`/customers/${customer.id}`}
                    className="group flex items-center gap-4 rounded-[26px] px-5 py-4"
                    style={{
                      background: "white",
                      border: "1px solid rgba(255,255,255,0.92)",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    <div
                      className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full text-sm font-bold"
                      style={{
                        background: `${color}16`,
                        color,
                        border: `1px solid ${color}26`,
                        fontFamily: "var(--font-syne, 'Bricolage Grotesque')",
                      }}
                    >
                      {initials(customer.name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-base font-bold" style={{ fontFamily: "var(--font-syne, 'Bricolage Grotesque')" }}>
                          {customer.name}
                        </p>
                        {customer.city ? (
                          <span
                            className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                            style={{ background: "var(--bg-surface-2)", color: "var(--text-3)" }}
                          >
                            {customer.city}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 truncate text-sm" style={{ color: "var(--text-3)" }}>
                        {customer.phone}
                      </p>
                      <div className="mt-3 max-w-[200px] rounded-full" style={{ background: "var(--bg-surface-3)" }}>
                        <motion.div
                          className="h-1.5 rounded-full"
                          style={{ background: color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.75, ease: "easeOut", delay: 0.12 + index * 0.02 }}
                        />
                      </div>
                    </div>

                    <div className="hidden items-center gap-8 text-right sm:flex">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-4)" }}>
                          Outstanding
                        </p>
                        <p className="mt-1 text-base font-bold" style={{ color: "var(--coral)", fontFamily: "var(--font-syne, 'Bricolage Grotesque')" }}>
                          {formatCurrency(outstanding)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-4)" }}>
                          Invoices
                        </p>
                        <p className="mt-1 text-base font-bold" style={{ fontFamily: "var(--font-syne, 'Bricolage Grotesque')" }}>
                          {customer.invoice_count}
                        </p>
                      </div>
                    </div>

                    <span
                      className="text-lg transition-transform duration-200 group-hover:translate-x-1"
                      style={{ color: "var(--text-3)" }}
                    >
                      →
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {query && filteredCustomers.length > 0 ? (
        <p className="mt-4 text-center text-xs" style={{ color: "var(--text-3)" }}>
          {filteredCustomers.length} of {customers.length} customers
        </p>
      ) : null}
    </div>
  );
}
