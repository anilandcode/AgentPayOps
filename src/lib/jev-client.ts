/*
 * Jev client — System One decision model (typesafe/jev).
 *
 * Jev is not a chat model. You send it `state` + typed `questions`
 * (noul = yes/no probability, choice = pick one option, score = rubric
 * level) and it returns probabilities in ~1 second for a fraction of a
 * cent. It handles the "decide" slice of the loop so the LLM only writes
 * and code only executes.
 *
 * Transport: Command Code Provider API endpoint /v1/systemone using the
 * same CMD_API_KEY as the memo bridge (GOAT-plan key). Interactive/CLI
 * transport is not used for Jev (Go-plan CLI key gets 403; the API key is
 * the documented path). Never set x-cmd-zdr on Jev requests — the model
 * has no ZDR upstream and the gateway refuses it with 422.
 *
 * Failure policy: every function here returns null on any error and the
 * caller must degrade gracefully. The product can never break because a
 * decision gate timed out.
 */

const SYSTEMONE_URL = "https://api.commandcode.ai/provider/v1/systemone";
const JEV_TIMEOUT_MS = 12_000;

export type JevNoul = { type: "noul"; noul: number };
export type JevChoice = {
  type: "choice";
  choice: string;
  confidence: number;
  probabilities: Record<string, number>;
};
export type JevScore = {
  type: "score";
  score: number;
  confidence: number;
  legend: Record<string, string>;
  probabilities: Record<string, number>;
};
export type JevAnswer = JevNoul | JevChoice | JevScore;

export type JevQuestion =
  | { type: "noul"; instructions: string; criteria?: { true: string; false: string } }
  | { type: "choice"; instructions: string; criteria: Record<string, string> }
  | { type: "score"; instructions: string; criteria: string[] };

export type JevResult = {
  answers: Record<string, JevAnswer>;
  usage: { input_tokens?: number; output_tokens?: number };
  latencyMs: number;
};

export function jevEnabled(): boolean {
  const mode = process.env.JEV_MODE?.trim().toLowerCase();
  if (mode === "off") {
    return false;
  }
  return Boolean(process.env.CMD_API_KEY?.trim());
}

function jevModel(): string {
  return process.env.JEV_MODEL?.trim() || "typesafe/jev";
}

/**
 * Ask Jev typed questions about a state blob. Returns null on any failure
 * (no key, timeout, non-2xx, malformed body) — callers must treat null as
 * "no ML signal" and fall back to code rules.
 */
export async function askJev(
  state: Record<string, unknown>,
  questions: Record<string, JevQuestion>,
  logTag = "jev",
): Promise<JevResult | null> {
  const apiKey = process.env.CMD_API_KEY?.trim();
  if (!apiKey || !jevEnabled()) {
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), JEV_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const response = await fetch(SYSTEMONE_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ model: jevModel(), state, questions }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.warn(`[${logTag}] systemone ${response.status}: ${text.slice(0, 160)}`);
      return null;
    }

    const parsed = (await response.json()) as {
      answers?: Record<string, JevAnswer>;
      usage?: JevResult["usage"];
    };
    if (!parsed.answers || typeof parsed.answers !== "object") {
      console.warn(`[${logTag}] systemone returned no answers`);
      return null;
    }

    return {
      answers: parsed.answers,
      usage: parsed.usage ?? {},
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    console.warn(`[${logTag}] request failed:`, (error as Error).message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
