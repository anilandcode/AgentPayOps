import { evaluatePayment, type PaymentRequest } from "@/lib/policy-engine";

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<PaymentRequest>;

  if (
    !payload.vendorName ||
    !payload.category ||
    typeof payload.amount !== "number"
  ) {
    return Response.json(
      {
        error:
          "vendorName, category, and numeric amount are required to evaluate a payment.",
      },
      { status: 400 },
    );
  }

  return Response.json(
    evaluatePayment({
      vendorName: payload.vendorName,
      category: payload.category,
      amount: payload.amount,
      invoiceId: payload.invoiceId,
    }),
  );
}
