"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

interface FormState {
  customer_name: string;
  phone: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  amount: string;
}

const today = new Date().toISOString().split("T")[0];

function createInitialForm(): FormState {
  return {
    customer_name: "",
    phone: "",
    invoice_number: "",
    invoice_date: today,
    due_date: "",
    amount: "",
  };
}

export default function QuickAddButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState<FormState>(createInitialForm());

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setError(null);
  }

  function resetForm() {
    setForm(createInitialForm());
    setError(null);
    setSuccess(false);
  }

  function closeModal() {
    if (loading) {
      return;
    }

    setOpen(false);
    resetForm();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.customer_name.trim() || !form.phone.trim() || !form.invoice_number.trim() || !form.amount.trim()) {
      setError("Customer name, phone, invoice number, and amount are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: [form] }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Failed to add invoice");
      }

      setSuccess(true);
      router.refresh();
      window.setTimeout(() => {
        setOpen(false);
        resetForm();
      }, 900);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => {
          resetForm();
          setOpen(true);
        }}
        className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #0A8F84, #0DC4B4)",
          boxShadow: "0 4px 12px rgba(10,143,132,0.35)",
          fontFamily: "var(--font-dm-sans, 'DM Sans')",
        }}
      >
        + Add Invoice
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            style={{ background: "rgba(12, 18, 25, 0.18)", backdropFilter: "blur(16px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
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
                  <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-syne, 'Bricolage Grotesque')" }}>
                    Add Invoice
                  </h2>
                  <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
                    Capture a new receivable without leaving the workspace.
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-xl"
                  style={{ background: "var(--bg-surface-2)", color: "var(--text-3)" }}
                  aria-label="Close add invoice modal"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    { label: "Customer Name *", field: "customer_name", type: "text", full: true, placeholder: "Ramesh Traders" },
                    { label: "Phone *", field: "phone", type: "text", full: true, placeholder: "9876543210" },
                    { label: "Invoice Number *", field: "invoice_number", type: "text", full: true, placeholder: "INV-001" },
                    { label: "Invoice Date", field: "invoice_date", type: "date", full: false, placeholder: "" },
                    { label: "Due Date", field: "due_date", type: "date", full: false, placeholder: "" },
                    { label: "Amount (INR) *", field: "amount", type: "number", full: true, placeholder: "25000" },
                  ].map(({ label, field, type, full, placeholder }) => (
                    <label key={field} className={full ? "sm:col-span-2" : ""}>
                      <span className="mb-1.5 block text-xs font-medium" style={{ color: "var(--text-3)" }}>
                        {label}
                      </span>
                      <input
                        type={type}
                        value={form[field as keyof FormState]}
                        onChange={(event) =>
                          setField(field as keyof FormState, event.target.value as FormState[keyof FormState])
                        }
                        placeholder={placeholder}
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
                </div>

                {error ? (
                  <p
                    className="rounded-2xl px-4 py-3 text-sm"
                    style={{
                      background: "var(--coral-light)",
                      border: "1px solid rgba(229,53,74,0.14)",
                      color: "var(--coral)",
                    }}
                  >
                    {error}
                  </p>
                ) : null}

                {success ? (
                  <p
                    className="rounded-2xl px-4 py-3 text-sm"
                    style={{
                      background: "var(--sage-light)",
                      border: "1px solid rgba(5,150,105,0.14)",
                      color: "var(--sage)",
                    }}
                  >
                    Invoice added successfully.
                  </p>
                ) : null}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 rounded-2xl px-4 py-3 text-sm font-medium"
                    style={{
                      background: "white",
                      color: "var(--text-2)",
                      border: "1px solid var(--border)",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || success}
                    className="flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition-all"
                    style={{
                      background:
                        loading || success
                          ? "linear-gradient(135deg, rgba(10,143,132,0.55), rgba(13,196,180,0.55))"
                          : "linear-gradient(135deg, #0A8F84, #0DC4B4)",
                      boxShadow: "0 14px 28px rgba(10,143,132,0.18)",
                    }}
                  >
                    {loading ? "Adding..." : success ? "Added" : "Add Invoice"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
