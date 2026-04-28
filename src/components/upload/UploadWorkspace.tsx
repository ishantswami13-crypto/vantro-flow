"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, FileText, Plus, Sparkles, UploadCloud } from "lucide-react";
import CountUp from "@/components/CountUp";
import Reveal from "@/components/Reveal";
import { useToast } from "@/components/Toast";

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
            className="vf-panel rounded-[28px] p-6 sm:p-8"
          >
            <p className="apple-eyebrow">Import</p>
            <h1 className="mt-3 max-w-3xl text-[3rem] font-semibold leading-[0.95] tracking-normal text-[var(--ink)] sm:text-[4.5rem]">
              Turn invoices into financial action.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--ink-3)] sm:text-base">
              Upload a CSV or add one invoice manually. Vantro Flow reads receivables, prepares risk context, and routes open amounts into Flow Queue.
            </p>
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
                {status === "loading" ? "Adding to Flow Queue..." : "Import invoices"}
              </button>
            </form>

            {status === "success" ? (
              <div
                className="mt-4 flex items-start gap-3 rounded-[24px] px-4 py-3 text-sm"
                style={{ background: "var(--success-soft)", border: "1px solid rgba(20,131,59,0.14)", color: "var(--success)" }}
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4" aria-hidden="true" />
                <span>{message || "Invoice added to your collection queue."}</span>
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
            <p className="apple-eyebrow">Manual invoice</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal text-[var(--ink)]">Add one receivable</h2>
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
    </main>
  );
}
