"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, ArrowRight, Camera, CheckCircle2, Database, FileText, Plus, ScanLine, ShieldCheck, Sparkles, UploadCloud, Workflow } from "lucide-react";
import CountUp from "@/components/CountUp";
import Reveal from "@/components/Reveal";
import { useToast } from "@/components/Toast";
import LiveScanner from "./LiveScanner";

type ManualInvoice = {
  customer_name: string;
  phone: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  amount: string;
  notes: string;
};

const initialManualInvoice: ManualInvoice = {
  customer_name: "",
  phone: "",
  invoice_number: "",
  invoice_date: new Date().toISOString().slice(0, 10),
  due_date: "",
  amount: "",
  notes: "",
};

const processingSteps = [
  { label: "Read invoice", detail: "Parse account, invoice number, amount, and dates", icon: ScanLine },
  { label: "Assess risk", detail: "Compare due date, exposure, and overdue pressure", icon: ShieldCheck },
  { label: "Route action", detail: "Prepare account context for the Flow Queue", icon: Workflow },
];

export default function UploadWorkspace() {
  const { toast } = useToast();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<string[][]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [manual, setManual] = useState<ManualInvoice>(initialManualInvoice);
  const [isScanning, setIsScanning] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (status !== "loading") {
      return;
    }

    const timer = window.setInterval(() => {
      setProgress((value) => Math.min(value + 14, 86));
    }, 240);
    return () => window.clearInterval(timer);
  }, [status]);

  function parseCSV(text: string): string[][] {
    return text
      .trim()
      .split("\n")
      .map((line) => line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")));
  }

  function previewFile(file: File) {
    setFileName(file.name);
    setSelectedFile(file);
    setStatus("idle");
    setMessage("");
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const text = loadEvent.target?.result as string;
      setPreview(parseCSV(text).slice(0, 6));
    };
    reader.readAsText(file);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    previewFile(file);
  }

  function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      previewFile(file);
    }
  }

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const file = selectedFile ?? (form.elements.namedItem("csv") as HTMLInputElement).files?.[0];
    if (!file) {
      setStatus("error");
      setMessage("Select a CSV file before importing.");
      toast({ type: "error", message: "Select a CSV file before importing" });
      return;
    }

    setMessage("");
    setProgress(12);
    setStatus("loading");

    const text = await file.text();
    const rows = parseCSV(text);
    const headers = rows[0].map((header) => header.toLowerCase().replace(/\s+/g, "_"));
    const data = rows.slice(1).map((row) => {
      const result: Record<string, string> = {};
      headers.forEach((header, index) => {
        result[header] = row[index] ?? "";
      });
      return result;
    });

    const response = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: data }),
    });

    const result = await response.json();
    if (response.ok) {
      setStatus("success");
      setProgress(100);
      setMessage(`Imported ${result.imported} invoices and created ${result.customers_created} new accounts.`);
      toast({ type: "success", message: `Imported ${result.imported} invoices` });
      setPreview([]);
      setFileName("");
      setSelectedFile(null);
    } else {
      setStatus("error");
      setMessage(result.error ?? "Upload failed.");
      toast({ type: "error", message: result.error ?? "Upload failed" });
    }
  }

  async function handleLiveCapture(base64Image: string) {
    setShowScanner(false);
    setIsScanning(true);
    setStatus("loading");
    setMessage("Scanning invoice with AI...");
    setProgress(30);

    try {
        setProgress(60);
        const response = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64Image }),
        });

        if (!response.ok) {
          throw new Error("Failed to scan invoice");
        }

        const data = await response.json();
        
        setManual((prev) => ({
          ...prev,
          customer_name: data.customer_name || prev.customer_name,
          phone: data.phone || prev.phone,
          invoice_number: data.invoice_number || prev.invoice_number,
          invoice_date: data.invoice_date || prev.invoice_date,
          due_date: data.due_date || prev.due_date,
          amount: data.amount || prev.amount,
        }));

        toast({ type: "success", message: "Invoice scanned! Please review the fields." });
        setStatus("idle");
        setMessage("");
        setProgress(0);
        setIsScanning(false);
    } catch {
      setStatus("error");
      setMessage("Failed to scan invoice image.");
      toast({ type: "error", message: "Scan failed" });
      setIsScanning(false);
    }
  }

  async function handleManualSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!manual.customer_name.trim() || !manual.phone.trim() || !manual.invoice_number.trim() || !manual.amount.trim()) {
      setStatus("error");
      setMessage("Customer, phone, invoice number, and amount are required.");
      toast({ type: "error", message: "Add the required invoice fields first" });
      return;
    }

    setMessage("");
    setProgress(12);
    setStatus("loading");
    const response = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: [manual] }),
    });

    const result = await response.json();
    if (response.ok) {
      setStatus("success");
      setMessage("Invoice added to your collection queue.");
      setManual(initialManualInvoice);
      toast({ type: "success", message: "Invoice added to collection queue" });
    } else {
      setStatus("error");
      setMessage(result.error ?? "Invoice could not be added.");
      toast({ type: "error", message: result.error ?? "Invoice could not be added" });
    }
  }

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Link href="/" className="magnetic mb-5 inline-flex text-sm font-medium" style={{ color: "var(--accent)" }}>
          Back to Command Center
        </Link>

        <Reveal>
        <section className="mb-6">
          <div
            className="vf-command-surface rounded-[28px] p-6 sm:p-8"
          >
            <p className="apple-eyebrow">Import</p>
            <h1 className="mt-3 max-w-4xl text-[2.65rem] font-semibold leading-[0.95] tracking-[-0.03em] text-[var(--ink)] sm:text-[4.5rem]">
              Turn invoices into financial action.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--ink-3)] sm:text-base">
              Upload a CSV or add one invoice manually. Vantro Flow reads receivables, prepares risk context, and routes open amounts into Flow Queue.
            </p>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {processingSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.label} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-glass)] p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <span className="mono text-[10px] text-[var(--text-muted)]">0{index + 1}</span>
                    </div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{step.label}</p>
                    <p className="mt-1 text-xs leading-5 text-[var(--text-tertiary)]">{step.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        </Reveal>

        <Reveal delay={100}>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div
            className="vf-card rounded-[32px] p-6"
          >
            <form onSubmit={handleUpload} className="space-y-4">
              <label
                htmlFor="csv"
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className="block cursor-pointer rounded-[28px] border p-10 text-center transition"
                style={{
                  borderColor: dragActive ? "var(--teal)" : "var(--line)",
                  background: dragActive ? "var(--teal-wash)" : "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(32,217,246,0.045))",
                }}
              >
                <input id="csv" name="csv" type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--teal-wash)] text-[var(--teal)]">
                  <UploadCloud className="h-7 w-7" aria-hidden="true" />
                </div>
                <p className="text-lg font-semibold tracking-normal text-[var(--ink)]">
                  Drop your invoice CSV here
                </p>
                <p className="mt-2 text-sm text-[var(--ink-3)]">
                  Supports `.csv` from your ERP, accounting system, or spreadsheet export.
                </p>
                {fileName ? (
                  <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--ink-2)]">
                    <FileText className="h-3.5 w-3.5 text-[var(--teal)]" aria-hidden="true" />
                    {fileName}
                  </div>
                ) : null}
              </label>

              {status === "loading" ? (
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-2 font-semibold text-[var(--ink)]">
                      <Sparkles className="h-3.5 w-3.5 text-[var(--teal)]" aria-hidden="true" />
                      Processing invoice fields
                    </span>
                    <span className="mono text-[var(--ink-3)]">{progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--surface)]">
                    <div className="h-full rounded-full bg-[var(--teal)] transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {processingSteps.map((step, index) => {
                      const active = progress >= 20 + index * 22;
                      return (
                        <div key={step.label} className="rounded-xl px-3 py-2 text-xs"
                          style={{ background: active ? "var(--brand-primary-soft)" : "var(--surface-0)", color: active ? "var(--brand-primary)" : "var(--text-tertiary)", border: "1px solid var(--border-subtle)" }}>
                          {step.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {preview.length > 0 ? (
                <div className="overflow-x-auto rounded-[24px] border border-[var(--line)] bg-[var(--surface)]">
                  <div className="flex items-center justify-between border-b border-[var(--line)] px-3 py-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-4)]">Review extracted fields</span>
                    <span className="text-xs text-[var(--ink-3)]">Confirm before import</span>
                  </div>
                  <table className="min-w-full text-xs">
                    <tbody>
                      {preview.map((row, rowIndex) => (
                        <tr
                          key={rowIndex}
                          style={{
                            background: rowIndex === 0 ? "var(--surface-2)" : "var(--surface)",
                            borderBottom: rowIndex < preview.length - 1 ? "1px solid var(--line)" : "none",
                          }}
                        >
                          {row.map((cell, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="max-w-[140px] truncate px-3 py-2"
                              style={{
                                color: rowIndex === 0 ? "var(--ink)" : "var(--ink-2)",
                                fontWeight: rowIndex === 0 ? 600 : 400,
                              }}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="px-3 py-2 text-xs text-[var(--ink-3)]">
                    Showing first <CountUp value={Math.max(preview.length - 1, 0)} duration={550} /> rows
                  </p>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={status === "loading"}
                className="magnetic apple-button apple-button-primary w-full py-3 text-sm font-semibold"
              >
                {status === "loading" ? "Adding to Flow Queue..." : "Import and create actions"}
              </button>
            </form>

            {status === "success" ? (
              <div
                className="mt-4 flex items-start gap-3 rounded-[24px] px-4 py-3 text-sm"
                style={{ background: "var(--success-soft)", border: "1px solid rgba(20,131,59,0.14)", color: "var(--success)" }}
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4" aria-hidden="true" />
                <span>{message || "Invoice added to Flow Queue. Next action created."}</span>
              </div>
            ) : null}

            {status === "error" ? (
              <div
                className="mt-4 flex items-start gap-3 rounded-[24px] px-4 py-3 text-sm"
                style={{ background: "var(--danger-soft)", border: "1px solid rgba(194,71,26,0.14)", color: "var(--danger)" }}
              >
                <AlertCircle className="mt-0.5 h-4 w-4" aria-hidden="true" />
                <span>{message}</span>
              </div>
            ) : null}
          </div>

          <div
            className="vf-card rounded-[32px] p-6"
          >
            <div className="mb-6 rounded-[24px] border border-[var(--line)] bg-[var(--surface-2)] p-4">
              <p className="apple-eyebrow mb-3">Trust layer</p>
              <div className="space-y-3">
                {[
                  { icon: Database, label: "Structured ledger input", body: "CSV and manual invoices feed the same receivables intelligence layer." },
                  { icon: ShieldCheck, label: "Human confirmed", body: "Review extracted fields before they enter the financial command center." },
                  { icon: ArrowRight, label: "Queue ready", body: "Every invoice becomes an account signal and follow-up action." },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--teal-wash)] text-[var(--teal)]">
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--ink)]">{item.label}</p>
                        <p className="text-xs leading-5 text-[var(--ink-3)]">{item.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="apple-eyebrow">Manual invoice</p>
            <div className="mt-2 flex items-center justify-between">
              <h2 className="text-2xl font-semibold tracking-normal text-[var(--ink)]">Add one receivable</h2>
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                disabled={isScanning}
                className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold shadow-sm transition hover:bg-[var(--surface-2)] disabled:opacity-50"
                style={{ color: "var(--ink)" }}
              >
                <Camera className="h-4 w-4 text-[var(--teal)]" />
                <span className="hidden sm:inline">{isScanning ? "Scanning..." : "Scan with Camera"}</span>
                <span className="sm:hidden">{isScanning ? "..." : "Scan"}</span>
              </button>
            </div>
            <form onSubmit={handleManualSubmit} className="mt-5 space-y-3">
              {[
                ["customer_name", "Account", "Atlas Components"],
                ["phone", "Phone", "9876543210"],
                ["invoice_number", "Invoice number", "INV-1042"],
                ["invoice_date", "Invoice date", ""],
                ["due_date", "Due date", ""],
                ["amount", "Amount", "25000"],
                ["notes", "Notes", "Payment expected after procurement approval"],
              ].map(([field, label, placeholder]) => (
                <label key={field} className="block">
                  <span className="mb-1.5 block text-xs font-medium text-[var(--ink-3)]">{label}</span>
                  <input
                    type={field.includes("date") ? "date" : field === "amount" ? "number" : "text"}
                    value={manual[field as keyof ManualInvoice]}
                    onChange={(event) => setManual((current) => ({ ...current, [field]: event.target.value }))}
                    placeholder={placeholder}
                    className="apple-input px-4 py-3 text-sm"
                  />
                </label>
              ))}
              <button type="submit" disabled={status === "loading"} className="magnetic apple-button apple-button-primary flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Save invoice
              </button>
            </form>

            <div className="mt-6 rounded-[24px] border border-[var(--line)] bg-[var(--surface-2)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-4)]">
                CSV format example
              </p>
              <pre className="mt-4 overflow-x-auto text-xs leading-6 text-[var(--ink-2)]">{`customer_name,phone,invoice_number,invoice_date,due_date,amount
Atlas Components,9876543210,INV-1042,2026-04-01,2026-04-30,450000
Northstar Retail,9123456789,INV-1098,2026-04-05,2026-05-05,285000`}</pre>
            </div>
          </div>
        </div>
        </Reveal>
      </div>

      {showScanner && (
        <LiveScanner 
          onCapture={handleLiveCapture} 
          onClose={() => setShowScanner(false)} 
        />
      )}
    </main>
  );
}
