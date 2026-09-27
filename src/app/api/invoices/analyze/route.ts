import { analyzeInvoiceText } from "@/lib/invoice-analysis";
import { assessInvoiceRisk } from "@/lib/jev-risk";
import { withinDemoLimit } from "@/lib/demo-rate-limit";

export const maxDuration = 30;

export async function POST(request: Request) {
  if (!withinDemoLimit(request, "invoice-analyze", 20)) return Response.json({ error: "Analysis limit reached. Try again in a minute." }, { status: 429 });
  const payload = (await request.json()) as {
    sampleId?: string;
    invoiceText?: string;
  };

  if (typeof payload.invoiceText !== "string" || !payload.invoiceText.trim() || payload.invoiceText.length > 20000) return Response.json({error:"Paste invoice text (up to 20,000 characters)."},{status:400});
  const invoiceText=payload.invoiceText;
  const analysis=analyzeInvoiceText(invoiceText,payload.sampleId);

  if (!analysis) {
    return Response.json(
      {
        error: "Could not extract a vendor and valid amount. Check the invoice text.",
      },
      { status: 422 },
    );
  }

  // Jev gate on parsed invoices: may only tighten approved -> escalated.
  let jevView: { fraudSignals: number; severity: string; riskScore: number } | null = null;

  if (analysis.recommendation === "approved") {
    const risk = await assessInvoiceRisk({
      invoiceId: analysis.invoiceId,
      vendorName: analysis.vendorName,
      amount: analysis.amount,
      category: analysis.category,
      findings: analysis.findings,
      invoiceText,
    });

    if (risk) {
      jevView = {
        fraudSignals: risk.fraudSignals,
        severity: risk.severity,
        riskScore: Math.max(analysis.riskScore, Math.round((risk.fraudSignals * 45) + (risk.severityScore + 1) * 8)),
      };
      analysis.riskScore = jevView.riskScore;

      if (risk.escalate) {
        analysis.recommendation = "escalated";
        analysis.summary =
          `Jev flagged fraud signals in this document (probability ${risk.fraudSignals.toFixed(2)}, ` +
          `severity ${risk.severity}) — routing to human review before payment. ` +
          analysis.summary;
      }
    }
  }

  return Response.json({
    analysis,
    extractedFrom: invoiceText,
    extractionSource: "text",
    jev: jevView,
    aiState: analysis.recommendation === "approved" || jevView ? (jevView ? "completed" : "unavailable") : "skipped by policy",
  });
}
