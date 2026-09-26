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
    !payload.transactionId ||
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
    actorName: payload.actorName?.trim() || "Finance Controller",
    note: payload.note?.trim() || undefined,
  });

  if ("error" in result && result.error) {
    return Response.json({ error: result.error }, { status: 409 });
  }

  return Response.json(result);
}
