"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { useToast } from "@/components/Toast";

interface FormState {
  customer_name: string;
  phone: string;
  city: string;
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
    city: "",
    invoice_number: "",
    invoice_date: today,
    due_date: "",
    amount: "",
  };
}

export default function QuickAddButton() {
  const router = useRouter();
  const { toast } = useToast();
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
      setError("Account name, phone, invoice number, and amount are required.");
      toast({ type: "error", message: "Add the required invoice fields first" });
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
      toast({ type: "success", message: `Invoice added for ${form.customer_name.trim()}` });
      router.refresh();
      window.setTimeout(() => {
        setOpen(false);
        resetForm();
      }, 900);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Something went wrong";
      setError(message);
      toast({ type: "error", message });
    } finally {
      setLoading(false);
    }
  }

  const fields: Array<{
    label: string;
    field: keyof FormState;
    type: string;
    placeholder: string;
    full?: boolean;
  }> = [
    { label: "Account name *", field: "customer_name", type: "text", placeholder: "Atlas Components", full: true },
    { label: "Phone *", field: "phone", type: "text", placeholder: "9876543210", full: true },
    { label: "City", field: "city", type: "text", placeholder: "Mumbai", full: true },
    { label: "Invoice number *", field: "invoice_number", type: "text", placeholder: "INV-1042", full: true },
    { label: "Invoice Date", field: "invoice_date", type: "date", placeholder: "" },
    { label: "Due Date", field: "due_date", type: "date", placeholder: "" },
    { label: "Amount (INR) *", field: "amount", type: "number", placeholder: "25000", full: true },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => {
          resetForm();
          setOpen(true);
        }}
        className="magnetic apple-button apple-button-primary inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium"
        aria-label="Add invoice"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        <span className="hidden min-[460px]:inline">Add invoice</span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          style={{ background: "rgba(10, 10, 10, 0.18)", backdropFilter: "blur(10px)" }}
          onClick={closeModal}
        >
          <div
            className="apple-modal w-full max-w-md rounded-3xl p-6"
            style={{ animation: "scale-in .22s ease-out" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-normal text-[var(--ink)]">
                  Add invoice
                </h2>
                <p className="mt-1 text-sm text-[var(--ink-3)]">
                  Capture a new receivable without leaving the workspace.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="magnetic flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink-3)] transition hover:text-[var(--ink)]"
                aria-label="Close add invoice modal"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {fields.map(({ label, field, type, placeholder, full }) => (
                  <label key={field} className={full ? "sm:col-span-2" : ""}>
                    <span className="mb-1.5 block text-xs font-medium text-[var(--ink-2)]">
                      {label}
                    </span>
                    <input
                      type={type}
                      value={form[field]}
                      onChange={(event) => setField(field, event.target.value)}
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
                    background: "var(--coral-wash)",
                    border: "1px solid rgba(214, 64, 69, 0.14)",
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
                    background: "var(--sage-wash)",
                    border: "1px solid rgba(45, 139, 78, 0.14)",
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
                  className="magnetic apple-button apple-button-secondary flex-1 px-4 py-3 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || success}
                  className="magnetic apple-button apple-button-primary flex-1 px-4 py-3 text-sm font-semibold"
                  style={{ opacity: loading || success ? 0.72 : 1 }}
                >
                  {loading ? "Adding..." : success ? "Added" : "Add invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
