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
        onClick={() => setOpen(true)}
        className="rounded-xl px-4 py-2 text-sm font-medium transition-all"
        style={{
          color: "var(--text-2)",
          border: "1px solid var(--border)",
          background: "white",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        + Add Note
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            style={{ background: "rgba(12, 18, 25, 0.16)", backdropFilter: "blur(14px)" }}
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
                    Add Note
                  </h3>
                  <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
                    Log call context, objections, or internal reminders for this customer.
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-xl"
                  style={{ background: "var(--bg-surface-2)", color: "var(--text-3)" }}
                  aria-label="Close note modal"
                >
                  ×
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
                  className="w-full resize-none rounded-[24px] px-4 py-3 text-sm outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.88)",
                    color: "var(--text-1)",
                    border: "1px solid var(--border)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.78)",
                  }}
                />

                {state === "error" ? (
                  <p
                    className="rounded-2xl px-4 py-3 text-sm"
                    style={{
                      background: "var(--coral-light)",
                      border: "1px solid rgba(229,53,74,0.14)",
                      color: "var(--coral)",
                    }}
                  >
                    Failed to save note. Try again.
                  </p>
                ) : null}

                <div className="flex gap-3">
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
                    disabled={state === "loading" || !text.trim()}
                    className="flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-white"
                    style={{
                      background: "linear-gradient(135deg, #0A8F84, #0DC4B4)",
                      boxShadow: "0 14px 28px rgba(10,143,132,0.18)",
                      opacity: state === "loading" || !text.trim() ? 0.6 : 1,
                    }}
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
