"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";

interface Props {
  customerId: number;
  invoiceId: number;
}

export default function ReminderButton({ customerId, invoiceId }: Props) {
  const { toast } = useToast();
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);

  async function handleClick() {
    setState("loading");
    try {
      const res = await fetch("/api/remind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: customerId, invoice_id: invoiceId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        setState("done");
        setOpen(true);
        toast({ type: "success", message: "Reminder message ready" });
      } else {
        setState("error");
        setMessage(data.error ?? "Failed to generate message.");
        toast({ type: "error", message: data.error ?? "Failed to generate reminder" });
      }
    } catch {
      setState("error");
      setMessage("Network error.");
      toast({ type: "error", message: "Network error while generating reminder" });
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={state === "loading"}
        className="magnetic px-3 py-1.5 rounded-lg text-xs font-medium text-white whitespace-nowrap transition-all"
        style={{
          backgroundColor: state === "done" ? "#065f60" : state === "error" ? "#7f1d1d" : "#0D7377",
          opacity: state === "loading" ? 0.7 : 1,
        }}
      >
        {state === "loading" ? "..." : state === "done" ? "Message Ready" : state === "error" ? "Error" : "Send Reminder"}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setOpen(false)}>
          <div
            className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Payment reminder</h3>
              <button onClick={() => setOpen(false)} className="magnetic text-gray-500 hover:text-white text-lg leading-none">×</button>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
              {message}
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { navigator.clipboard.writeText(message); }}
                className="magnetic flex-1 py-2 rounded-lg text-sm font-medium border border-gray-700 text-gray-300 hover:border-gray-500 transition-colors"
              >
                Copy
              </button>
              <button
                onClick={() => setOpen(false)}
                className="magnetic flex-1 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: "#0D7377" }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
