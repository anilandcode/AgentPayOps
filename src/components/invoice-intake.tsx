"use client";

import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ClipboardList,
  FileText,
  FileUp,
  Loader2,
  SearchCheck,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useDemoData } from "@/components/workspace-shell";
import {
  invoiceSamples,
  type Decision,
  type InvoiceAnalysis,
} from "@/lib/sample-data";

type InvoiceAnalyzeResponse = {
  analysis: InvoiceAnalysis;
  extractedFrom: string;
  extractionSource?: "text" | "command-code";
  fileName?: string;
};

const decisionStyles: Record<Decision, string> = {
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  blocked: "border-rose-200 bg-rose-50 text-rose-700",
  escalated: "border-amber-200 bg-amber-50 text-amber-700",
  pending: "border-slate-200 bg-slate-50 text-slate-600",
  released: "border-teal-200 bg-teal-50 text-teal-700",
};

function formatMoney(amount: number, currencyCode: InvoiceAnalysis["currency"]) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
}

export function InvoiceIntake() {
  const { setInvoiceDraft } = useDemoData();
  const [selectedSampleId, setSelectedSampleId] = useState(invoiceSamples[0].id);
  const [invoiceText, setInvoiceText] = useState(() => { try { return sessionStorage.getItem("agentpayops:invoice-text") || invoiceSamples[0].invoiceText; } catch { return invoiceSamples[0].invoiceText; } });
  const [analysis, setAnalysis] = useState<InvoiceAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [extractionSource, setExtractionSource] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function selectSample(sampleId: string) {
    const sample = invoiceSamples.find((candidate) => candidate.id === sampleId);

    if (!sample) {
      return;
    }

    setSelectedSampleId(sample.id);
    setInvoiceText(sample.invoiceText);
    sessionStorage.setItem("agentpayops:invoice-text",sample.invoiceText);
    setInvoiceDraft("");
    setAnalysis(null);
    setUploadedFileName(null);
    setExtractionSource(null);
    setUploadError(null);
  }

  async function analyzeInvoice() {
    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/invoices/analyze", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sampleId: selectedSampleId,
          invoiceText,
        }),
      });
      const body = (await response.json()) as InvoiceAnalyzeResponse;
      if (!response.ok || !body.analysis) throw new Error((body as InvoiceAnalyzeResponse & {error?:string}).error || "Invoice analysis failed.");
      setAnalysis(body.analysis);
      setInvoiceDraft(JSON.stringify(body.analysis));
      setExtractionSource(body.extractionSource ?? "text");
      setUploadError(null);
    } catch (error) { setUploadError(error instanceof Error ? error.message : "Invoice analysis failed."); } finally {
      setIsAnalyzing(false);
    }
  }

  async function uploadInvoice(file: File | undefined) {
    if (!file) {
      return;
    }

    setIsAnalyzing(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("invoice", file);

      const response = await fetch("/api/invoices/upload", {
        method: "POST",
        body: formData,
      });
      const body = (await response.json()) as InvoiceAnalyzeResponse & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(body.error || "Invoice upload failed.");
      }

      setSelectedSampleId("uploaded");
      setInvoiceText(body.extractedFrom);
      setAnalysis(body.analysis);
      setInvoiceDraft(JSON.stringify(body.analysis));
      setUploadedFileName(body.fileName ?? file.name);
      setExtractionSource(body.extractionSource ?? null);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Invoice upload failed.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Invoice Intake
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Turn unstructured invoices into governed agent work
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Select a sample invoice, analyze it, and see the extracted fields,
            risk findings, and required paid-data purchase before the payment
            workflow runs.
          </p>
        </div>
        <button
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={isAnalyzing}
          onClick={analyzeInvoice}
          type="button"
        >
          {isAnalyzing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <SearchCheck className="size-4" />
          )}
          Analyze invoice
        </button>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {invoiceSamples.map((sample) => (
              <button
                className={`rounded-lg border p-3 text-left text-sm font-semibold transition ${
                  selectedSampleId === sample.id
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
                }`}
                key={sample.id}
                onClick={() => selectSample(sample.id)}
                type="button"
              >
                {sample.label}
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4">
            <label className="flex cursor-pointer flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                <FileUp className="size-4" />
                Upload invoice file
              </span>
              <span className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white">
                Choose file
              </span>
              <input
                accept=".txt,.csv,.json,.xml,image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={isAnalyzing}
                onChange={(event) => uploadInvoice(event.target.files?.[0])}
                type="file"
              />
            </label>
            <p className="mt-3 text-xs text-slate-600">Shared demo: use sample documents. Raw uploads are processed in memory and are not retained. TXT, CSV, JSON, XML, JPEG, PNG, WebP · 6 MB maximum. PDF is unsupported.</p>
            {uploadedFileName ? (
              <p className="mt-3 text-sm text-slate-600">
                {uploadedFileName} · {extractionSource === "command-code" ? "image text extracted by Command Code" : "text extracted"}
              </p>
            ) : null}
            {uploadError ? (
              <p className="mt-3 text-sm font-medium text-rose-700">{uploadError}</p>
            ) : null}
          </div>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FileText className="size-4" />
              Invoice text
            </span>
            <textarea
              className="min-h-72 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-sm leading-6 text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
              onChange={(event) => { setInvoiceText(event.target.value); sessionStorage.setItem("agentpayops:invoice-text",event.target.value); setSelectedSampleId("edited"); }}
              value={invoiceText}
            />
          </label>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          {analysis ? (
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Extracted invoice
                  </p>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                    {analysis.vendorName}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {analysis.invoiceId} · Due {analysis.dueDate} ·{" "}
                    {analysis.category}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${decisionStyles[analysis.recommendation]}`}
                >
                  Intake suggestion: {analysis.recommendation}
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">{([ ["invoiceId","Invoice ID"],["vendorName","Vendor"],["amount","Amount"],["category","Category"] ] as const).map(([key,label])=><label key={key} className="field-label">{label}<input className="w-full rounded-lg border border-slate-300 bg-white p-3" type={key==="amount"?"number":"text"} min={key==="amount"?"0.01":undefined} max={key==="amount"?"50000":undefined} value={analysis[key]} onChange={event=>{const value=key==="amount"?Number(event.target.value):event.target.value;const next={...analysis,[key]:value};setAnalysis(next);setInvoiceDraft(JSON.stringify(next));}}/></label>)}</div><p className="muted-note">Confirm or edit these fields before evaluation. This suggestion is based on document content; the server makes the final policy decision. The evaluated amount is the invoice total above, separate from any paid data report.</p><Link className="button-primary" href="/runs">Evaluate this invoice →</Link>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Amount
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {formatMoney(analysis.amount, analysis.currency)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Risk score
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {analysis.riskScore}/100
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Currency
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {analysis.currency}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <Bot className="mt-0.5 size-5 text-slate-700" />
                  <div>
                    <h4 className="font-semibold text-slate-950">
                      Intake summary
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {analysis.summary}
                    </p>
                  </div>
                </div>
              </div>

              <ul className="mt-4 space-y-2">
                {analysis.findings.map((finding) => (
                  <li
                    className="flex gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-600"
                    key={finding}
                  >
                    {analysis.recommendation === "blocked" ? (
                      <AlertTriangle className="mt-1 size-4 shrink-0 text-rose-600" />
                    ) : (
                      <CheckCircle2 className="mt-1 size-4 shrink-0 text-emerald-600" />
                    )}
                    {finding}
                  </li>
                ))}
              </ul>

              {analysis.requiredDataPurchase ? (
                <div className="mt-4 rounded-lg border border-cyan-200 bg-cyan-50 p-4">
                  <div className="flex items-center gap-2 font-semibold text-cyan-950">
                    <ClipboardList className="size-4 text-cyan-700" />
                    Required paid data before approval
                  </div>
                  <p className="mt-2 text-sm leading-6 text-cyan-900">
                    Buy a{" "}
                    {formatMoney(
                      analysis.requiredDataPurchase.amount,
                      analysis.currency,
                    )}{" "}
                    {analysis.requiredDataPurchase.category} report from{" "}
                    {analysis.requiredDataPurchase.vendorName}.{" "}
                    {analysis.requiredDataPurchase.reason}
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center">
              <SearchCheck className="size-8 text-slate-400" />
              <h3 className="mt-4 font-semibold text-slate-950">
                No analysis yet
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Run invoice analysis to create the structured record an
                autonomous finance agent can act on.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
