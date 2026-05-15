import { withX402 } from "@x402/next";
import { NextRequest, NextResponse } from "next/server";

import {
  buildPaymentRequiredBody,
  createVendorRiskRouteConfig,
  createX402ResourceServer,
  getX402RuntimeConfig,
} from "@/lib/x402-server";

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

async function handler(request: NextRequest): Promise<NextResponse<unknown>> {
  const url = new URL(request.url);
  const vendorName = url.searchParams.get("vendorName") || defaultReport.vendorName;
  const runtimeConfig = getX402RuntimeConfig();

  if (runtimeConfig.enabled) {
    return NextResponse.json({
      report: buildReport(vendorName),
      paymentReference: request.headers.get("x-payment") ?? "x402-settled",
      paymentMode: "x402",
    });
  }

  const paymentProof = request.headers.get("x-payment-proof");

  if (!paymentProof) {
    return NextResponse.json(buildPaymentRequiredBody("demo"), {
      status: 402,
      headers: {
        "x-accepts-payment": "x402-demo",
        "x-payment-amount": "0.42",
        "x-payment-currency": "USDC",
      },
    });
  }

  return NextResponse.json({
    report: buildReport(vendorName),
    paymentReference: paymentProof,
    paymentMode: "demo",
  });
}

let x402Handler: typeof handler | null = null;

export async function GET(request: NextRequest) {
  const runtimeConfig = getX402RuntimeConfig();

  if (!runtimeConfig.enabled) {
    return handler(request);
  }

  x402Handler ??= withX402(
    handler,
    createVendorRiskRouteConfig(runtimeConfig),
    createX402ResourceServer(runtimeConfig),
  );

  return x402Handler(request);
}
