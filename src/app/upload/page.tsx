"use client";

import Link from "next/link";
import { useState } from "react";

export default function UploadPage() {
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
      setMessage(`Imported ${result.imported} invoices, ${result.customers_created} new customers.`);
      setPreview([]);
    } else {
      setStatus("error");
      setMessage(result.error ?? "Upload failed.");
    }
  }

  return (
    <main className="min-h-screen pt-16" style={{ background: "var(--bg-base)" }}>
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <Link href="/" className="mb-5 inline-flex text-sm font-medium" style={{ color: "var(--teal)" }}>
          ← Back to Dashboard
        </Link>

        <section className="mb-8">
          <div
            className="surface-panel rounded-[34px] p-6 sm:p-8"
            style={{ border: "1px solid rgba(255,255,255,0.92)", boxShadow: "var(--shadow-lg)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--teal)" }}>
              Import
            </p>
            <h1 className="mt-3 text-4xl font-bold" style={{ color: "var(--text-1)" }}>
              Upload invoices
            </h1>
            <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--text-3)" }}>
              Upload a CSV with `customer_name`, `phone`, `invoice_number`, `invoice_date`, `due_date`, and `amount`.
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div
            className="rounded-[28px] p-6"
            style={{ background: "white", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}
          >
            <form onSubmit={handleUpload} className="space-y-4">
              <div
                className="rounded-[26px] border-2 border-dashed p-10 text-center transition-colors"
                style={{ borderColor: "rgba(10,143,132,0.18)", background: "rgba(230,247,246,0.42)" }}
              >
                <input id="csv" name="csv" type="file" accept=".csv" required onChange={handleFileChange} className="hidden" />
                <label htmlFor="csv" className="cursor-pointer">
                  <div
                    className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl"
                    style={{ background: "white", color: "var(--teal)", boxShadow: "var(--shadow-sm)" }}
                  >
                    ↑
                  </div>
                  <p className="text-base font-semibold" style={{ color: "var(--text-1)" }}>
                    Click to select a CSV file
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
                            background: rowIndex === 0 ? "var(--bg-surface-2)" : "white",
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
                    Showing first {Math.max(preview.length - 1, 0)} rows
                  </p>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-[24px] py-3 font-semibold text-white"
                style={{
                  background:
                    status === "loading"
                      ? "linear-gradient(135deg, rgba(10,143,132,0.55), rgba(13,196,180,0.55))"
                      : "linear-gradient(135deg, #0A8F84, #0DC4B4)",
                  boxShadow: "0 18px 36px rgba(10,143,132,0.16)",
                }}
              >
                {status === "loading" ? "Importing..." : "Import invoices"}
              </button>
            </form>

            {status === "success" ? (
              <div
                className="mt-4 rounded-[24px] px-4 py-3 text-sm"
                style={{ background: "var(--sage-light)", border: "1px solid rgba(5,150,105,0.14)", color: "var(--sage)" }}
              >
                {message}
              </div>
            ) : null}

            {status === "error" ? (
              <div
                className="mt-4 rounded-[24px] px-4 py-3 text-sm"
                style={{ background: "var(--coral-light)", border: "1px solid rgba(229,53,74,0.14)", color: "var(--coral)" }}
              >
                {message}
              </div>
            ) : null}
          </div>

          <div
            className="rounded-[28px] p-6"
            style={{ background: "white", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-4)" }}>
              CSV format example
            </p>
            <pre className="mt-4 overflow-x-auto text-xs leading-6" style={{ color: "var(--text-2)" }}>{`customer_name,phone,invoice_number,invoice_date,due_date,amount
Ramesh Traders,9876543210,INV-001,2024-01-01,2024-01-31,15000
Sharma & Sons,9123456789,INV-002,2024-01-05,2024-02-05,28500`}</pre>
          </div>
        </div>
      </div>
    </main>
  );
}
