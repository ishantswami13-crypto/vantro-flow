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
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Something went wrong");
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
        className="apple-button apple-button-primary px-4 py-2.5 text-sm font-semibold"
      >
        Add invoice
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            style={{ background: "rgba(12, 18, 25, 0.14)", backdropFilter: "blur(18px)" }}
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
              className="apple-modal w-full max-w-md rounded-[30px] p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold tracking-[-0.03em]">Add invoice</h2>
                  <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
                    Capture a new receivable without leaving the workspace.
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="apple-button apple-button-secondary flex h-10 w-10 items-center justify-center text-sm font-semibold"
                  aria-label="Close add invoice modal"
                >
                  X
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
                        className="apple-input px-4 py-3 text-sm"
                      />
                    </label>
                  ))}
                </div>

                {error ? (
                  <p
                    className="rounded-2xl px-4 py-3 text-sm"
                    style={{
                      background: "var(--danger-soft)",
                      border: "1px solid rgba(194,71,26,0.14)",
                      color: "var(--danger)",
                    }}
                  >
                    {error}
                  </p>
                ) : null}

                {success ? (
                  <p
                    className="rounded-2xl px-4 py-3 text-sm"
                    style={{
                      background: "var(--success-soft)",
                      border: "1px solid rgba(20,131,59,0.14)",
                      color: "var(--success)",
                    }}
                  >
                    Invoice added successfully.
                  </p>
                ) : null}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="apple-button apple-button-secondary flex-1 px-4 py-3 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || success}
                    className="apple-button apple-button-primary flex-1 px-4 py-3 text-sm font-semibold"
                    style={{ opacity: loading || success ? 0.7 : 1 }}
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
