import {
  buildFallbackMemo,
  type FinanceMemo,
  type FinanceMemoInput,
} from "@/lib/finance-memo";
import { askCommandCode, extractJsonObject } from "@/lib/cmd-llm";

export const maxDuration = 90;

function parseMemo(text: string, fallback: FinanceMemo, model: string): FinanceMemo {
  const parsed = extractJsonObject(text) as Partial<FinanceMemo> | null;

  if (
    parsed &&
    parsed.headline &&
    parsed.summary &&
    parsed.riskLevel &&
    parsed.nextAction &&
    Array.isArray(parsed.evidence)
  ) {
    const risk = String(parsed.riskLevel).toLowerCase();
    return {
      source: `command-code:${model}`,
      headline: String(parsed.headline),
      summary: String(parsed.summary),
      riskLevel: risk === "low" || risk === "high" ? risk : "medium",
      nextAction: String(parsed.nextAction),
      evidence: parsed.evidence.filter((item): item is string => typeof item === "string"),
    };
  }

  return fallback;
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<FinanceMemoInput>;

  if (
    !payload.vendorName ||
    !payload.category ||
    typeof payload.amount !== "number" ||
    !payload.decision ||
    !payload.reason ||
    !Array.isArray(payload.checks)
  ) {
    return Response.json(
      {
        error:
          "vendorName, category, amount, decision, reason, and checks are required.",
      },
      { status: 400 },
    );
  }

  const input: FinanceMemoInput = {
    vendorName: payload.vendorName,
    category: payload.category,
    amount: payload.amount,
    invoiceId: payload.invoiceId,
    decision: payload.decision,
    reason: payload.reason,
    checks: payload.checks,
  };
  const fallback = buildFallbackMemo(input);

  const prompt = `You are a finance controls analyst explaining an autonomous AI agent payment decision. Do not use any tools, do not read any files; answer directly from the input below.
Return ONLY valid JSON (no markdown fences) with these keys:
headline: short sentence
summary: 1-2 sentences for a CFO
riskLevel: one of low, medium, high
nextAction: one concrete operational step
evidence: array of 3-5 short evidence strings

Decision input:
${JSON.stringify(input, null, 2)}
`;

  const answer = await askCommandCode(prompt, "agent-reasoning");

  if (!answer) {
    return Response.json(fallback);
  }

  return Response.json(parseMemo(answer.text, fallback, answer.model));
}
