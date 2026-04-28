"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

interface Props {
  customerId: number;
  invoiceId: number;
  amount: number;
  onPaid: () => void;
}

function ModalFrame({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="linear-dialog-backdrop fixed inset-0 z-[70] flex items-center justify-center p-4 fade-up"
      onClick={onClose}
    >
      <div
        className="linear-dialog animate-slide-up w-full max-w-lg rounded-[24px] p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold tracking-normal">{title}</h3>
            <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="magnetic apple-button apple-button-secondary flex h-9 w-9 items-center justify-center rounded-[12px] text-sm font-semibold"
            aria-label={`Close ${title} modal`}
          >
            X
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function InvoiceActions({ customerId, invoiceId, amount, onPaid }: Props) {
  const router = useRouter();
  const { toast } = useToast();
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
        setReminderOpen(true);
        toast({ type: "error", message: "Failed to generate reminder" });
        return;
      }

      setReminderMessage(result.message);
      setReminderState("done");
      setReminderOpen(true);
      toast({ type: "success", message: "Payment reminder ready" });
    } catch {
      setReminderState("error");
      setReminderMessage("Failed to generate reminder");
      setReminderOpen(true);
      toast({ type: "error", message: "Failed to generate reminder" });
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
        toast({ type: "error", message: "Failed to save promise" });
        return;
      }

      setPromiseState("done");
      toast({ type: "success", message: "Payment promise saved" });
      router.refresh();
      window.setTimeout(() => {
        setPromiseOpen(false);
        setPromiseState("idle");
      }, 800);
    } catch {
      setPromiseState("error");
      toast({ type: "error", message: "Failed to save promise" });
    }
  }

  async function handlePaid() {
    setPaidLoading(true);

    try {
      const response = await fetch(`/api/invoice/${invoiceId}/paid`, { method: "POST" });
      if (response.ok) {
        onPaid();
        toast({ type: "success", message: "Invoice marked as paid" });
        router.refresh();
      } else {
        toast({ type: "error", message: "Failed to mark invoice paid" });
      }
    } catch {
      toast({ type: "error", message: "Failed to mark invoice paid" });
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
          className="magnetic apple-button rounded-[10px] px-2.5 py-1.5 text-[11px] font-semibold"
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
          className="magnetic apple-button rounded-[10px] px-2.5 py-1.5 text-[11px] font-semibold"
          style={{ background: "var(--amber-wash)", color: "var(--amber)" }}
        >
          Promise
        </button>
        <button
          type="button"
          onClick={handlePaid}
          disabled={paidLoading}
          className="magnetic apple-button rounded-[10px] px-2.5 py-1.5 text-[11px] font-semibold"
          style={{
            background: "var(--success-soft)",
            color: "var(--success)",
            opacity: paidLoading ? 0.7 : 1,
          }}
        >
          {paidLoading ? "Saving..." : "Paid"}
        </button>
      </div>

      {reminderOpen ? (
        <ModalFrame
          title={reminderState === "error" ? "Reminder unavailable" : "Payment reminder"}
          description={
            reminderState === "error" ? "The reminder could not be generated for this invoice." : "Ready-to-send payment follow-up copy."
          }
          onClose={() => setReminderOpen(false)}
        >
          <div
            className="whitespace-pre-wrap rounded-[24px] px-4 py-4 text-sm leading-6"
            style={{
              background: reminderState === "error" ? "var(--danger-soft)" : "var(--bg-surface-2)",
              border: "1px solid var(--border)",
              color: reminderState === "error" ? "var(--danger)" : "var(--text-2)",
            }}
          >
            {reminderMessage}
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={copyReminder}
              disabled={reminderState === "error"}
              className="magnetic apple-button apple-button-secondary flex-1 rounded-[12px] px-4 py-3 text-sm font-medium"
              style={{ opacity: reminderState === "error" ? 0.55 : 1 }}
            >
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              type="button"
              onClick={() => setReminderOpen(false)}
              className="magnetic apple-button apple-button-primary flex-1 rounded-[12px] px-4 py-3 text-sm font-semibold"
            >
              Done
            </button>
          </div>
        </ModalFrame>
      ) : null}

      {promiseOpen ? (
        <ModalFrame
          title="Mark payment promise"
          description="Track the amount and date committed by the account."
          onClose={() => {
            if (promiseState !== "loading") {
              setPromiseOpen(false);
              setPromiseState("idle");
            }
          }}
        >
          <form onSubmit={handlePromise} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {[{
                label: "Promised Amount (INR)",
                type: "number",
                value: promisedAmount,
                onChange: setPromisedAmount,
                required: true,
              }, {
                label: "Payment Date",
                type: "date",
                value: promisedDate,
                onChange: setPromisedDate,
                required: true,
                min: today,
              }].map((field) => (
                <label key={field.label} className="block">
                  <span className="mb-1.5 block text-xs font-medium" style={{ color: "var(--text-3)" }}>
                    {field.label}
                  </span>
                  <input
                    type={field.type}
                    value={field.value}
                    min={"min" in field ? field.min : undefined}
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
              className="magnetic apple-button w-full rounded-[12px] px-4 py-3 text-sm font-semibold"
              style={{
                background:
                  promiseState === "loading" || promiseState === "done"
                    ? "rgba(10, 143, 132, 0.42)"
                    : "var(--teal-primary)",
                color: "#ffffff",
              }}
            >
              {promiseState === "loading" ? "Saving..." : promiseState === "done" ? "Saved" : "Save promise"}
            </button>
          </form>
        </ModalFrame>
      ) : null}
    </>
  );
}
