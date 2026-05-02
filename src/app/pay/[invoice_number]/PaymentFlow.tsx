"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PaymentFlow({ invoiceNumber }: { invoiceNumber: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "processing" | "success" | "error">("idle");

  async function handlePay() {
    setState("processing");
    // Simulate network delay for fake payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const res = await fetch(`/api/pay/${invoiceNumber}`, { method: "POST" });
      if (res.ok) {
        setState("success");
        setTimeout(() => {
          router.refresh();
        }, 1500);
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="rounded-[16px] p-4 text-center animate-fade-in" style={{ background: "var(--success-soft)", color: "var(--success)" }}>
        <p className="font-semibold">Payment Successful!</p>
        <p className="text-sm mt-1">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {state === "error" && (
        <div className="rounded-[12px] p-3 text-sm text-center" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
          Payment failed. Please try again.
        </div>
      )}
      
      <button
        onClick={handlePay}
        disabled={state === "processing"}
        className="w-full rounded-[16px] py-4 text-base font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
        style={{
          background: "var(--text-1)",
          color: "var(--bg-base)",
          opacity: state === "processing" ? 0.7 : 1,
        }}
      >
        {state === "processing" ? "Processing Securely..." : "Pay Now"}
      </button>

      <div className="flex items-center justify-center gap-2 mt-4 opacity-40">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-1)" }}>Secured by Stripe</span>
      </div>
    </div>
  );
}
