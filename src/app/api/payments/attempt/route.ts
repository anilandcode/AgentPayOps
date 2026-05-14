import { evaluatePayment } from "@/lib/policy-engine";

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    vendorName?: string;
    amount?: number;
    category?: string;
    invoiceId?: string;
  };

  if (!payload.vendorName || !payload.category || typeof payload.amount !== "number") {
    return Response.json(
      {
        error:
          "vendorName, category, and numeric amount are required to attempt payment.",
      },
      { status: 400 },
    );
  }

  const evaluation = evaluatePayment({
    vendorName: payload.vendorName,
    category: payload.category,
    amount: payload.amount,
    invoiceId: payload.invoiceId,
  });

  if (evaluation.decision !== "approved") {
    return Response.json({
      status: evaluation.decision,
      paymentIssued: false,
      evaluation,
    });
  }

  return Response.json({
    status: "approved",
    paymentIssued: true,
    x402Reference: `x402-demo-${crypto.randomUUID().slice(0, 8)}`,
    evaluation,
  });
}
