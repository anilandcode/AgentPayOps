import { saveAgentRun, type AgentRunRecord } from "@/lib/persistence";

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<AgentRunRecord>;

  if (
    !payload.scenario ||
    !payload.payment ||
    !payload.memo ||
    !payload.completedAt
  ) {
    return Response.json(
      {
        error: "scenario, payment, memo, and completedAt are required.",
      },
      { status: 400 },
    );
  }

  return Response.json(
    await saveAgentRun({
      scenario: payload.scenario,
      payment: payload.payment,
      memo: payload.memo,
      report: payload.report ?? null,
      completedAt: payload.completedAt,
    }),
  );
}
