import { analyzeInvoiceText, inferSampleId } from "@/lib/invoice-analysis";
import { invoiceSamples } from "@/lib/sample-data";

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

  return Response.json({
    analysis,
    extractedFrom: invoiceText,
    extractionSource: "text",
  });
}
