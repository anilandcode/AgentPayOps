import { recordHumanDecision, type HumanDecision } from "@/lib/persistence";

export const maxDuration = 30;

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    transactionId?: string;
    decision?: HumanDecision;
    actorName?: string;
    note?: string;
  };

  if (
    !payload.transactionId || payload.transactionId.length > 100 || (payload.note?.length ?? 0) > 500 ||
    (payload.decision !== "released" && payload.decision !== "cancelled")
  ) {
    return Response.json(
      { error: "transactionId and decision ('released'|'cancelled') are required." },
      { status: 400 },
    );
  }

  const result = await recordHumanDecision({
    transactionId: payload.transactionId,
    decision: payload.decision,
    actorName: "Demo reviewer",
    note: payload.note?.trim() || undefined,
  });

  if ("error" in result && result.error) {
    return Response.json({ error: result.error, source: result.source }, { status: result.source === "unavailable" ? 503 : 409 });
  }

  return Response.json(result);
}
