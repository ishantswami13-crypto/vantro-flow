"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

interface Props {
  customerId: number;
}

export default function AddNoteButton({ customerId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim()) {
      return;
    }

    setState("loading");

    try {
      const response = await fetch("/api/note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: customerId, message_text: text }),
      });

      if (!response.ok) {
        setState("error");
        return;
      }

      setText("");
      setOpen(false);
      setState("idle");
      router.refresh();
    } catch {
      setState("error");
    }
  }

  function closeModal() {
    if (state === "loading") {
      return;
    }

    setOpen(false);
    setState("idle");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="apple-button apple-button-secondary rounded-[12px] px-3 py-2 text-sm font-medium"
      >
        Add note
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="linear-dialog-backdrop fixed inset-0 z-[70] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
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
                  <h3 className="text-lg font-semibold tracking-[-0.03em]">Add note</h3>
                  <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
                    Log call context, objections, or internal reminders for this customer.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="apple-button apple-button-secondary flex h-9 w-9 items-center justify-center rounded-[12px] text-sm font-semibold"
                  aria-label="Close note modal"
                >
                  X
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <textarea
                  value={text}
                  onChange={(event) => {
                    setText(event.target.value);
                    if (state === "error") {
                      setState("idle");
                    }
                  }}
                  placeholder="Write a concise note about the customer, payment plan, or last touchpoint..."
                  rows={5}
                  required
                  autoFocus
                  className="apple-input w-full resize-none px-4 py-3 text-sm"
                />

                {state === "error" ? (
                  <p
                    className="rounded-[16px] px-4 py-3 text-sm"
                    style={{
                      background: "var(--danger-soft)",
                      border: "1px solid rgba(194, 75, 96, 0.14)",
                      color: "var(--danger)",
                    }}
                  >
                    Failed to save note. Try again.
                  </p>
                ) : null}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="apple-button apple-button-secondary flex-1 rounded-[12px] px-4 py-3 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={state === "loading" || !text.trim()}
                    className="apple-button apple-button-primary flex-1 rounded-[12px] px-4 py-3 text-sm font-semibold"
                    style={{ opacity: state === "loading" || !text.trim() ? 0.65 : 1 }}
                  >
                    {state === "loading" ? "Saving..." : "Save Note"}
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
