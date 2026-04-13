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
          onClick={handleReminder}
          disabled={reminderState === "loading"}
          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all active:scale-95"
          style={{
            background: "var(--teal-light)",
            color: "var(--teal)",
            opacity: reminderState === "loading" ? 0.7 : 1,
          }}
        >
          {reminderState === "loading" ? "Sending..." : reminderState === "done" ? "Sent" : "Remind"}
        </button>
        <button
          onClick={() => setPromiseOpen(true)}
          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all active:scale-95"
          style={{ background: "var(--purple-light)", color: "var(--purple)" }}
        >
          Promise
        </button>
        <button
          onClick={handlePaid}
          disabled={paidLoading}
          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all active:scale-95"
          style={{
            background: "var(--sage-light)",
            color: "var(--sage)",
            opacity: paidLoading ? 0.7 : 1,
          }}
        >
          {paidLoading ? "Saving..." : "Paid"}
        </button>
      </div>

      <AnimatePresence>
        {reminderOpen ? (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            style={{ background: "rgba(12, 18, 25, 0.16)", backdropFilter: "blur(14px)" }}
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
              className="w-full max-w-lg rounded-[28px] p-6"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.97), rgba(255,255,255,0.93))",
                border: "1px solid rgba(255,255,255,0.92)",
                boxShadow: "var(--shadow-xl)",
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-syne, 'Bricolage Grotesque')" }}>
                    WhatsApp Reminder
                  </h3>
                  <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
                    Ready-to-send payment follow-up copy.
                  </p>
                </div>
                <button
                  onClick={() => setReminderOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-xl"
                  style={{ background: "var(--bg-surface-2)", color: "var(--text-3)" }}
                  aria-label="Close reminder modal"
                >
                  ×
                </button>
              </div>

              <div
                className="rounded-[24px] px-4 py-4 text-sm leading-6 whitespace-pre-wrap"
                style={{
                  background: "rgba(255,255,255,0.88)",
                  border: "1px solid var(--border)",
                  color: "var(--text-2)",
                }}
              >
                {reminderMessage}
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={copyReminder}
                  className="flex-1 rounded-2xl px-4 py-3 text-sm font-medium"
                  style={{
                    background: "white",
                    color: "var(--text-2)",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={() => setReminderOpen(false)}
                  className="flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-white"
                  style={{
                    background: "linear-gradient(135deg, #0A8F84, #0DC4B4)",
                    boxShadow: "0 14px 28px rgba(10,143,132,0.18)",
                  }}
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
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            style={{ background: "rgba(12, 18, 25, 0.16)", backdropFilter: "blur(14px)" }}
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
              className="w-full max-w-md rounded-[28px] p-6"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.97), rgba(255,255,255,0.93))",
                border: "1px solid rgba(255,255,255,0.92)",
                boxShadow: "var(--shadow-xl)",
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-syne, 'Bricolage Grotesque')" }}>
                    Mark Payment Promise
                  </h3>
                  <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
                    Track the amount and date committed by the customer.
                  </p>
                </div>
                <button
                  onClick={() => setPromiseOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-xl"
                  style={{ background: "var(--bg-surface-2)", color: "var(--text-3)" }}
                  aria-label="Close promise modal"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handlePromise} className="space-y-4">
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
                  {
                    label: "Notes",
                    type: "text",
                    value: notes,
                    onChange: setNotes,
                    required: false,
                    placeholder: "Will pay after dispatch settlement",
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
                      placeholder={field.placeholder}
                      onChange={(event) => field.onChange(event.target.value)}
                      className="w-full rounded-2xl px-4 py-3 text-sm outline-none transition-all"
                      style={{
                        background: "rgba(255,255,255,0.88)",
                        color: "var(--text-1)",
                        border: "1px solid var(--border)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.78)",
                      }}
                    />
                  </label>
                ))}

                {promiseState === "error" ? (
                  <p
                    className="rounded-2xl px-4 py-3 text-sm"
                    style={{
                      background: "var(--coral-light)",
                      border: "1px solid rgba(229,53,74,0.14)",
                      color: "var(--coral)",
                    }}
                  >
                    Failed to save the payment promise. Try again.
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={promiseState === "loading" || promiseState === "done"}
                  className="w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white"
                  style={{
                    background:
                      promiseState === "loading" || promiseState === "done"
                        ? "linear-gradient(135deg, rgba(124,58,237,0.55), rgba(139,92,246,0.55))"
                        : "linear-gradient(135deg, #7C3AED, #8B5CF6)",
                    boxShadow: "0 14px 28px rgba(124,58,237,0.14)",
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
