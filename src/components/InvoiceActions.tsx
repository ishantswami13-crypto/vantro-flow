"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

interface Props {
  customerId: number;
  invoiceId: number;
  amount: number;
  onPaid: () => void;
}

export default function InvoiceActions({ customerId, invoiceId, amount, onPaid }: Props) {
  const router = useRouter();
  const [reminderState, setReminderState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [reminderMessage, setReminderMessage] = useState("");
  const [reminderOpen, setReminderOpen] = useState(false);
  const [promiseOpen, setPromiseOpen] = useState(false);
  const [promisedAmount, setPromisedAmount] = useState(amount.toString());
  const [promisedDate, setPromisedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [promiseState, setPromiseState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [paidLoading, setPaidLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleReminder() {
    setReminderState("loading");

    try {
      const response = await fetch("/api/remind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: customerId, invoice_id: invoiceId }),
      });
      const result = await response.json();

      if (!response.ok) {
        setReminderState("error");
        setReminderMessage(result.error ?? "Failed to generate reminder");
        return;
      }

      setReminderMessage(result.message);
      setReminderState("done");
      setReminderOpen(true);
    } catch {
      setReminderState("error");
      setReminderMessage("Failed to generate reminder");
    }
  }

  async function handlePromise(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPromiseState("loading");

    try {
      const response = await fetch("/api/promise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
          invoice_id: invoiceId,
          promised_amount: promisedAmount,
          promised_date: promisedDate,
          notes,
        }),
      });

      if (!response.ok) {
        setPromiseState("error");
        return;
      }

      setPromiseState("done");
      router.refresh();
      window.setTimeout(() => {
        setPromiseOpen(false);
        setPromiseState("idle");
      }, 800);
    } catch {
      setPromiseState("error");
    }
  }

  async function handlePaid() {
    setPaidLoading(true);

    try {
      const response = await fetch(`/api/invoice/${invoiceId}/paid`, { method: "POST" });
      if (response.ok) {
        onPaid();
        router.refresh();
      }
    } finally {
      setPaidLoading(false);
    }
  }

  async function copyReminder() {
    if (!reminderMessage) {
      return;
    }

    await navigator.clipboard.writeText(reminderMessage);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={handleReminder}
          disabled={reminderState === "loading"}
          className="apple-button rounded-[10px] px-2.5 py-1.5 text-[11px] font-semibold"
          style={{
            background: "var(--accent-soft)",
            color: "var(--accent)",
            opacity: reminderState === "loading" ? 0.7 : 1,
          }}
        >
          {reminderState === "loading" ? "Sending..." : reminderState === "done" ? "Sent" : "Remind"}
        </button>
        <button
          type="button"
          onClick={() => setPromiseOpen(true)}
          className="apple-button rounded-[10px] px-2.5 py-1.5 text-[11px] font-semibold"
          style={{ background: "var(--lavender-soft)", color: "var(--lavender)" }}
        >
          Promise
        </button>
        <button
          type="button"
          onClick={handlePaid}
          disabled={paidLoading}
          className="apple-button rounded-[10px] px-2.5 py-1.5 text-[11px] font-semibold"
          style={{
            background: "var(--success-soft)",
            color: "var(--success)",
            opacity: paidLoading ? 0.7 : 1,
          }}
        >
          {paidLoading ? "Saving..." : "Paid"}
        </button>
      </div>

      <AnimatePresence>
        {reminderOpen ? (
          <motion.div
            className="linear-dialog-backdrop fixed inset-0 z-[70] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setReminderOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="linear-dialog w-full max-w-lg rounded-[24px] p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold tracking-[-0.03em]">WhatsApp reminder</h3>
                  <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
                    Ready-to-send payment follow-up copy.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReminderOpen(false)}
                  className="apple-button apple-button-secondary flex h-9 w-9 items-center justify-center rounded-[12px] text-sm font-semibold"
                  aria-label="Close reminder modal"
                >
                  X
                </button>
              </div>

              <div
                className="rounded-[24px] px-4 py-4 whitespace-pre-wrap text-sm leading-6"
                style={{
                  background: "var(--bg-surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--text-2)",
                }}
              >
                {reminderMessage}
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={copyReminder}
                  className="apple-button apple-button-secondary flex-1 rounded-[12px] px-4 py-3 text-sm font-medium"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={() => setReminderOpen(false)}
                  className="apple-button apple-button-primary flex-1 rounded-[12px] px-4 py-3 text-sm font-semibold"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {promiseOpen ? (
          <motion.div
            className="linear-dialog-backdrop fixed inset-0 z-[70] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPromiseOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="linear-dialog w-full max-w-md rounded-[24px] p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold tracking-[-0.03em]">Mark payment promise</h3>
                  <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
                    Track the amount and date committed by the customer.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPromiseOpen(false)}
                  className="apple-button apple-button-secondary flex h-9 w-9 items-center justify-center rounded-[12px] text-sm font-semibold"
                  aria-label="Close promise modal"
                >
                  X
                </button>
              </div>

              <form onSubmit={handlePromise} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    {
                      label: "Promised Amount (INR)",
                      type: "number",
                      value: promisedAmount,
                      onChange: setPromisedAmount,
                      required: true,
                    },
                    {
                      label: "Payment Date",
                      type: "date",
                      value: promisedDate,
                      onChange: setPromisedDate,
                      required: true,
                      min: today,
                    },
                  ].map((field) => (
                    <label key={field.label} className="block">
                      <span className="mb-1.5 block text-xs font-medium" style={{ color: "var(--text-3)" }}>
                        {field.label}
                      </span>
                      <input
                        type={field.type}
                        value={field.value}
                        min={field.min}
                        required={field.required}
                        onChange={(event) => field.onChange(event.target.value)}
                        className="apple-input px-4 py-3 text-sm"
                      />
                    </label>
                  ))}
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium" style={{ color: "var(--text-3)" }}>
                    Notes
                  </span>
                  <input
                    type="text"
                    value={notes}
                    placeholder="Will pay after dispatch settlement"
                    onChange={(event) => setNotes(event.target.value)}
                    className="apple-input px-4 py-3 text-sm"
                  />
                </label>

                {promiseState === "error" ? (
                  <p
                    className="rounded-[16px] px-4 py-3 text-sm"
                    style={{
                      background: "var(--danger-soft)",
                      border: "1px solid rgba(194, 75, 96, 0.14)",
                      color: "var(--danger)",
                    }}
                  >
                    Failed to save the payment promise. Try again.
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={promiseState === "loading" || promiseState === "done"}
                  className="apple-button w-full rounded-[12px] px-4 py-3 text-sm font-semibold"
                  style={{
                    background:
                      promiseState === "loading" || promiseState === "done"
                        ? "rgba(111, 94, 242, 0.42)"
                        : "var(--lavender)",
                    color: "#ffffff",
                  }}
                >
                  {promiseState === "loading"
                    ? "Saving..."
                    : promiseState === "done"
                      ? "Saved"
                      : "Save Promise"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
