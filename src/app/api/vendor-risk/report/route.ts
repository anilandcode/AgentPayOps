function buildReport(vendorName: string) {
  return {
    vendorName,
    riskScore: vendorName === "Veritas Risk Graph" ? 12 : 18,
    sanctionsMatch: false,
    operatingHistory:
      vendorName === "Veritas Risk Graph" ? "Verified since 2019" : "Verified since 2021",
    paymentRecommendation: "safe-to-pay",
    summary: `${vendorName} has a verified operating history, no sanctions matches, and low payment risk for the requested invoice.`,
  };
}

const defaultReport = {
  vendorName: "Northstar Data Labs",
  riskScore: 18,
  sanctionsMatch: false,
  operatingHistory: "Verified since 2021",
  paymentRecommendation: "safe-to-pay",
  summary:
    "Northstar Data Labs has a verified operating history, no sanctions matches, and low payment risk for the requested invoice.",
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const vendorName = url.searchParams.get("vendorName") || defaultReport.vendorName;
  const paymentProof = request.headers.get("x-payment-proof");

  if (!paymentProof) {
    return Response.json(
      {
        error: "payment_required",
        message: "Vendor-risk report requires a programmable payment.",
        amount: "0.42",
        currency: "EUR",
        accepts: "x402-demo",
        paymentHeader: "x-payment-proof",
      },
      {
        status: 402,
        headers: {
          "x-accepts-payment": "x402-demo",
          "x-payment-amount": "0.42",
          "x-payment-currency": "EUR",
        },
      },
    );
  }

  return Response.json({
    report: buildReport(vendorName),
    paymentReference: paymentProof,
  });
}
