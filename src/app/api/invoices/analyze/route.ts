import { analyzeInvoiceText, inferSampleId } from "@/lib/invoice-analysis";
import { invoiceSamples } from "@/lib/sample-data";
import { assessInvoiceRisk } from "@/lib/jev-risk";

export const maxDuration = 30;

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    sampleId?: string;
    invoiceText?: string;
  };

  const sampleId =
    payload.sampleId ||
    inferSampleId(payload.invoiceText || invoiceSamples[0].invoiceText);
  const invoiceText =
    payload.invoiceText ||
    invoiceSamples.find((sample) => sample.id === sampleId)?.invoiceText ||
    invoiceSamples[0].invoiceText;
  const analysis = analyzeInvoiceText(invoiceText, payload.sampleId);

  if (!analysis) {
    return Response.json(
      {
        error: "Unknown invoice sample.",
      },
      { status: 404 },
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
  });
}
