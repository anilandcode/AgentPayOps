import { invoiceAnalyses, invoiceSamples } from "@/lib/sample-data";

function inferSampleId(invoiceText: string) {
  const normalized = invoiceText.toLowerCase();

  if (normalized.includes("apex enrichment")) {
    return "sample-duplicate-enrichment";
  }

  if (normalized.includes("metro cloud")) {
    return "sample-cloud-escalation";
  }

  return "sample-vendor-risk";
}

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    sampleId?: string;
    invoiceText?: string;
  };

  const sampleId =
    payload.sampleId ||
    inferSampleId(payload.invoiceText || invoiceSamples[0].invoiceText);
  const analysis = invoiceAnalyses[sampleId];

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
    extractedFrom:
      payload.invoiceText ||
      invoiceSamples.find((sample) => sample.id === sampleId)?.invoiceText,
  });
}
