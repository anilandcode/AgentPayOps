export async function GET() {
  return Response.json({
    status: "ok",
    service: "agentpayops",
    timestamp: new Date().toISOString(),
  });
}
