import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  buildFallbackMemo,
  type FinanceMemo,
  type FinanceMemoInput,
} from "@/lib/finance-memo";

function parseMemo(text: string, fallback: FinanceMemo): FinanceMemo {
  try {
    const parsed = JSON.parse(text) as Partial<FinanceMemo>;

    if (
      parsed.headline &&
      parsed.summary &&
      parsed.riskLevel &&
      parsed.nextAction &&
      Array.isArray(parsed.evidence)
    ) {
      return {
        source: "gemini",
        headline: parsed.headline,
        summary: parsed.summary,
        riskLevel: parsed.riskLevel,
        nextAction: parsed.nextAction,
        evidence: parsed.evidence.filter((item): item is string => typeof item === "string"),
      };
    }
  } catch {
    return fallback;
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
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return Response.json(fallback);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent(`
You are a finance controls analyst explaining an autonomous AI agent payment decision.
Return only valid JSON with these keys:
headline: short sentence
summary: 1-2 sentences for a CFO
riskLevel: one of low, medium, high
nextAction: one concrete operational step
evidence: array of 3-5 short evidence strings

Decision input:
${JSON.stringify(input, null, 2)}
`);
    const text = result.response.text();

    return Response.json(parseMemo(text, fallback));
  } catch {
    return Response.json(fallback);
  }
}
