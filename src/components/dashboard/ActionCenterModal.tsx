"use client";

import { useState } from "react";
import { CheckCircle2, ChevronRight, Loader2, Send, Sparkles, X } from "lucide-react";
import type { DashboardPayload } from "@/components/dashboard/types";
import { formatCompact } from "@/lib/format";

interface ActionCenterModalProps {
  items: DashboardPayload["followUpList"];
  onClose: () => void;
  onComplete: () => void;
}

export default function ActionCenterModal({ items, onClose, onComplete }: ActionCenterModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isFinished, setIsFinished] = useState(false);

  const pendingItems = items.filter((item) => (item.daysOverdue ?? 0) > 0);
  const totalAmount = pendingItems.reduce((sum, item) => sum + Math.max(Number(item.amount) - Number(item.amountPaid ?? 0), 0), 0);

  async function executeAll() {
    setIsProcessing(true);
    
    for (let i = 0; i < pendingItems.length; i++) {
      const item = pendingItems[i];
      setCurrentIndex(i);
      
      try {
        await fetch("/api/remind", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customer_id: item.customerId, invoice_id: item.id, tone: "firm" }),
        });
      } catch {
        console.error("Failed to send reminder for", item.id);
      }

      setCompletedIds((prev) => new Set(prev).add(item.id));
      
      // Artificial delay for dopamine effect and to prevent rate limits
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    setIsProcessing(false);
    setIsFinished(true);
    
    // Auto-close and refresh after 2.5 seconds
    setTimeout(() => {
      onComplete();
    }, 2500);
  }

  if (pendingItems.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[28px] bg-[var(--surface-0)] shadow-2xl border border-[var(--border-subtle)]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4 bg-[var(--surface-1)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">AI Action Center</h2>
              <p className="text-xs text-[var(--text-tertiary)]">{pendingItems.length} tasks ready for execution</p>
            </div>
          </div>
          {!isProcessing && !isFinished && (
            <button onClick={onClose} className="rounded-full p-2 text-[var(--text-tertiary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {isFinished ? (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-scale-in">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[var(--success-soft)]">
                <CheckCircle2 className="h-12 w-12 text-[var(--success)]" />
              </div>
              <h3 className="text-3xl font-semibold text-[var(--text-primary)] mb-2">Inbox Zero</h3>
              <p className="text-[var(--text-secondary)] max-w-md">
                All {pendingItems.length} overdue accounts have been contacted. We&apos;ve initiated the recovery of {formatCompact(totalAmount)}.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="mb-6 rounded-2xl bg-[var(--surface-2)] p-4 border border-[var(--border-subtle)]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">Total Exposure</span>
                  <span className="text-sm font-bold text-[var(--danger)]">{formatCompact(totalAmount)}</span>
                </div>
                <p className="text-xs text-[var(--text-tertiary)]">
                  Approving will automatically generate and send firm payment links to the following accounts.
                </p>
              </div>

              {pendingItems.map((item, index) => {
                const isComplete = completedIds.has(item.id);
                const isActive = currentIndex === index;
                const outstandingAmount = Math.max(Number(item.amount) - Number(item.amountPaid ?? 0), 0);

                return (
                  <div 
                    key={item.id} 
                    className={`flex items-center justify-between rounded-xl p-4 border transition-all duration-300 ${
                      isComplete 
                        ? "border-[var(--success-soft)] bg-[var(--success-soft)]/20" 
                        : isActive 
                          ? "border-[var(--brand-primary)] bg-[var(--surface-1)] shadow-sm" 
                          : "border-[var(--border-subtle)] bg-[var(--surface-0)]"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">{item.customerName}</span>
                        <span className="text-xs text-[var(--text-tertiary)]">INV-{item.invoiceNumber} · {item.daysOverdue}d overdue</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-[var(--text-secondary)]">{formatCompact(outstandingAmount)}</span>
                      <div className="w-24 flex justify-end">
                        {isComplete ? (
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--success)] animate-fade-in">
                            <CheckCircle2 className="h-4 w-4" /> Sent
                          </span>
                        ) : isActive ? (
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--brand-primary)] animate-pulse">
                            <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                            Pending <ChevronRight className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isFinished && (
          <div className="border-t border-[var(--border-subtle)] bg-[var(--surface-1)] p-6">
            <button
              onClick={executeAll}
              disabled={isProcessing}
              className={`magnetic flex w-full items-center justify-center gap-2 rounded-full py-4 text-sm font-bold text-white transition-all ${
                isProcessing ? "bg-[var(--surface-3)] cursor-not-allowed opacity-80" : "bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 shadow-lg shadow-[var(--brand-primary)]/20 hover:scale-[1.02]"
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Processing {currentIndex + 1} of {pendingItems.length}...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" /> Approve & Execute All Actions
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
