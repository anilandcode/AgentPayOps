import { HTTPFacilitatorClient } from "@x402/core/server";
import type { Network } from "@x402/core/types";
import { registerExactEvmScheme } from "@x402/evm/exact/server";
import { type RouteConfig, x402ResourceServer } from "@x402/next";

const DEFAULT_FACILITATOR_URL = "https://facilitator.x402.org";
const DEFAULT_NETWORK = "eip155:84532" as Network;
const DEFAULT_VENDOR_REPORT_PRICE = "0.42";

const networkAliases: Record<string, Network> = {
  base: "eip155:8453" as Network,
  "base-sepolia": "eip155:84532" as Network,
};

export type X402RuntimeConfig = {
  mode: "demo" | "real";
  enabled: boolean;
  payTo: string;
  network: Network;
  facilitatorUrl: string;
  vendorReportPrice: string;
};

export function getX402RuntimeConfig(): X402RuntimeConfig {
  const payTo = process.env.X402_RECEIVING_ADDRESS || process.env.EVM_ADDRESS || "";
  const requestedMode = process.env.X402_MODE === "real" ? "real" : "demo";

  return {
    mode: requestedMode,
    enabled: requestedMode === "real" && Boolean(payTo),
    payTo,
    network: normalizeNetwork(process.env.X402_NETWORK),
    facilitatorUrl: process.env.X402_FACILITATOR_URL || DEFAULT_FACILITATOR_URL,
    vendorReportPrice: process.env.X402_VENDOR_REPORT_PRICE || DEFAULT_VENDOR_REPORT_PRICE,
  };
}

export function createX402ResourceServer(config = getX402RuntimeConfig()) {
  const facilitatorClient = new HTTPFacilitatorClient({ url: config.facilitatorUrl });
  const server = new x402ResourceServer(facilitatorClient);

  registerExactEvmScheme(server, { networks: [config.network] });

  return server;
}

export function createVendorRiskRouteConfig(config = getX402RuntimeConfig()): RouteConfig {
  if (!config.payTo) {
    throw new Error("X402_RECEIVING_ADDRESS or EVM_ADDRESS is required when X402_MODE=real.");
  }

  return {
    accepts: {
      scheme: "exact",
      price: config.vendorReportPrice,
      network: config.network,
      payTo: config.payTo,
      maxTimeoutSeconds: 60,
    },
    description: "AgentPayOps vendor-risk report for autonomous invoice approval.",
    mimeType: "application/json",
    resource: "/api/vendor-risk/report",
    unpaidResponseBody: () => ({
      contentType: "application/json",
      body: buildPaymentRequiredBody("real"),
    }),
    settlementFailedResponseBody: () => ({
      contentType: "application/json",
      body: {
        ...buildPaymentRequiredBody("real"),
        error: "payment_settlement_failed",
        message: "The X402 payment could not be settled by the facilitator.",
      },
    }),
  };
}

export function buildPaymentRequiredBody(mode: "demo" | "real") {
  const { vendorReportPrice, network } = getX402RuntimeConfig();

  return {
    error: "payment_required",
    message: "Vendor-risk report requires a programmable payment.",
    amount: formatAmount(vendorReportPrice),
    currency: inferCurrency(vendorReportPrice),
    accepts: mode === "real" ? "x402" : "x402-demo",
    paymentHeader: mode === "real" ? "x-payment" : "x-payment-proof",
    network,
    mode,
  };
}

function normalizeNetwork(network: string | undefined): Network {
  if (!network) {
    return DEFAULT_NETWORK;
  }

  return networkAliases[network] ?? (network as Network);
}

function formatAmount(price: string) {
  return price.replace(/^[^\d]+/, "") || price;
}

function inferCurrency(price: string) {
  if (price.startsWith("€")) {
    return "EUR";
  }

  return "USDC";
}
