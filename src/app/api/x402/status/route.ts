import { NextResponse } from "next/server";

import { getX402RuntimeConfig } from "@/lib/x402-server";

export async function GET() {
  const config = getX402RuntimeConfig();

  return NextResponse.json({
    mode: config.enabled ? "real" : "demo",
    configuredMode: config.mode,
    network: config.network,
    facilitatorUrl: config.facilitatorUrl,
    vendorReportPrice: config.vendorReportPrice,
    protectedPath: "/api/vendor-risk/report",
    receivingAddressConfigured: Boolean(config.payTo),
  });
}
