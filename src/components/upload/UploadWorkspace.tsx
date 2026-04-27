"use client";

import Link from "next/link";
import { useState } from "react";
import CountUp from "@/components/CountUp";
import Reveal from "@/components/Reveal";
import { useToast } from "@/components/Toast";

export default function UploadWorkspace() {
  const { toast } = useToast();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<string[][]>([]);

  function parseCSV(text: string): string[][] {
    return text
      .trim()
      .split("\n")
      .map((line) => line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")));
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const text = loadEvent.target?.result as string;
      setPreview(parseCSV(text).slice(0, 6));
    };
    reader.readAsText(file);
  }

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const file = (form.elements.namedItem("csv") as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }

    setStatus("loading");
    setMessage("");

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
      setMessage(`Imported ${result.imported} invoices and created ${result.customers_created} new customers.`);
      toast({ type: "success", message: `Imported ${result.imported} invoices` });
      setPreview([]);
    } else {
      setStatus("error");
      setMessage(result.error ?? "Upload failed.");
      toast({ type: "error", message: result.error ?? "Upload failed" });
    }
  }

  return (
    <main className="min-h-screen pt-24 sm:pt-28" style={{ background: "var(--bg-base)" }}>
      <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Link href="/" className="magnetic mb-5 inline-flex text-sm font-medium" style={{ color: "var(--accent)" }}>
          Back to dashboard
        </Link>

        <Reveal>
        <section className="mb-6">
          <div
            className="surface-panel rounded-[24px] p-6"
          >
            <p className="apple-eyebrow">Import</p>
            <h1 className="mt-3 text-[2rem] font-semibold leading-[1] tracking-[-0.05em] sm:text-[2.4rem]">
              Upload invoices
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 sm:text-base" style={{ color: "var(--text-3)" }}>
              Bring in a CSV with customer name, phone, invoice number, invoice date, due date, and amount.
            </p>
          </div>
        </section>
        </Reveal>

        <Reveal delay={100}>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div
            className="rounded-[32px] p-6"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
          >
            <form onSubmit={handleUpload} className="space-y-4">
              <div
                className="rounded-[28px] border p-10 text-center transition-colors"
                style={{
                  borderColor: "rgba(0,113,227,0.16)",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.72), rgba(0,113,227,0.04))",
                }}
              >
                <input id="csv" name="csv" type="file" accept=".csv" required onChange={handleFileChange} className="hidden" />
                <label htmlFor="csv" className="cursor-pointer">
                  <div
                    className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold"
                    style={{ background: "var(--surface)", color: "var(--accent)", boxShadow: "var(--shadow-sm)" }}
                  >
                    CSV
                  </div>
                  <p className="text-base font-semibold tracking-[-0.02em]" style={{ color: "var(--text-1)" }}>
                    Select a CSV file
                  </p>
                  <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
                    Drag and drop also works in the browser.
                  </p>
                </label>
              </div>

              {preview.length > 0 ? (
                <div className="overflow-x-auto rounded-[24px]" style={{ border: "1px solid var(--border)" }}>
                  <table className="min-w-full text-xs">
                    <tbody>
                      {preview.map((row, rowIndex) => (
                        <tr
                          key={rowIndex}
                          style={{
                            background: rowIndex === 0 ? "rgba(29,29,31,0.035)" : "rgba(255,255,255,0.78)",
                            borderBottom: rowIndex < preview.length - 1 ? "1px solid var(--border)" : "none",
                          }}
                        >
                          {row.map((cell, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="max-w-[140px] truncate px-3 py-2"
                              style={{
                                color: rowIndex === 0 ? "var(--text-1)" : "var(--text-2)",
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
                  <p className="px-3 py-2 text-xs" style={{ color: "var(--text-3)" }}>
                    Showing first <CountUp value={Math.max(preview.length - 1, 0)} duration={550} /> rows
                  </p>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={status === "loading"}
                className="magnetic apple-button apple-button-primary w-full py-3 text-sm font-semibold"
              >
                {status === "loading" ? "Importing..." : "Import invoices"}
              </button>
            </form>

            {status === "success" ? (
              <div
                className="mt-4 rounded-[24px] px-4 py-3 text-sm"
                style={{ background: "var(--success-soft)", border: "1px solid rgba(20,131,59,0.14)", color: "var(--success)" }}
              >
                {message}
              </div>
            ) : null}

            {status === "error" ? (
              <div
                className="mt-4 rounded-[24px] px-4 py-3 text-sm"
                style={{ background: "var(--danger-soft)", border: "1px solid rgba(194,71,26,0.14)", color: "var(--danger)" }}
              >
                {message}
              </div>
            ) : null}
          </div>

          <div
            className="rounded-[32px] p-6"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-4)" }}>
              CSV format example
            </p>
            <pre className="mt-4 overflow-x-auto text-xs leading-6" style={{ color: "var(--text-2)" }}>{`customer_name,phone,invoice_number,invoice_date,due_date,amount
Ramesh Traders,9876543210,INV-001,2024-01-01,2024-01-31,15000
Sharma & Sons,9123456789,INV-002,2024-01-05,2024-02-05,28500`}</pre>
          </div>
        </div>
        </Reveal>
      </div>
    </main>
  );
}
