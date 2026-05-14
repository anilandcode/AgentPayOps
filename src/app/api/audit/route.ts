import { auditEvents, transactions } from "@/lib/sample-data";

export async function GET() {
  return Response.json({
    auditEvents,
    transactions,
  });
}
