import { spawn } from "node:child_process";
import { constants } from "node:fs";
import { access, mkdir, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

/*
 * Command Code LLM bridge.
 *
 * Two transports, tried in order per request:
 *  1. cmd CLI (headless `cmd -p`) — works on any machine where the CLI is
 *     installed and logged in (Go plan included). Primary for local runs.
 *  2. Command Code Provider API (OpenAI-compatible chat/completions) — needs
 *     a plan with API access; used automatically on deployments once the
 *     account has it. Set CMD_LLM_MODE=off to disable the whole bridge.
 *
 * Models chain through CMD_MODELS (default: stealth/space-bunny-alpha →
 * xiaomi/mimo-v2.6-pro → meta/muse-spark-1.3-contributor). First valid
 * answer wins.
 */

export const DEFAULT_CMD_MODELS = [
  "stealth/space-bunny-alpha",
  "xiaomi/mimo-v2.6-pro",
  "meta/muse-spark-1.3-contributor",
];

const PROVIDER_CHAT_URL = "https://api.commandcode.ai/provider/v1/chat/completions";
const SANDBOX_DIR = path.join(os.tmpdir(), "agentpayops-cmd-sandbox");
const CLI_TIMEOUT_MS = 55_000;
const HTTP_TIMEOUT_MS = 40_000;

export type CmdAnswer = {
  text: string;
  model: string;
  via: "cmd-cli" | "cmd-http";
};

export function cmdModels(): string[] {
  const raw = process.env.CMD_MODELS?.trim();
  if (!raw) {
    return DEFAULT_CMD_MODELS;
  }
  return raw
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);
}

function llmMode(): "auto" | "cli" | "http" | "off" {
  const mode = process.env.CMD_LLM_MODE?.trim().toLowerCase();
  return mode === "off" || mode === "cli" || mode === "http" ? mode : "auto";
}

async function cliEnvApiKey(): Promise<string> {
  // The CLI stores its key here; reuse it for the Provider API so a single
  // login covers both transports (billing plan still gates the HTTP route).
  try {
    const raw = await readFile(
      path.join(os.homedir(), ".commandcode", "auth.json"),
      "utf8",
    );
    const parsed = JSON.parse(raw) as { apiKey?: string };
    return parsed.apiKey ?? "";
  } catch {
    return "";
  }
}

async function resolveApiKey(): Promise<string> {
  return process.env.CMD_API_KEY?.trim() || (await cliEnvApiKey());
}

let cliBinaryPromise: Promise<string | null> | null = null;

function cliCandidatePaths(): string[] {
  const override = process.env.CMD_BIN?.trim();
  const base = ["cmd", "command-code"];
  const known = [
    path.join(os.homedir(), ".nvm/versions/node/v22.22.3/bin/cmd"),
    path.join(os.homedir(), ".nvm/versions/node/v22.22.3/bin/command-code"),
    "/opt/homebrew/bin/cmd",
    "/usr/local/bin/cmd",
  ];
  return override ? [override, ...base, ...known] : [...base, ...known];
}

function findCliBinary(): Promise<string | null> {
  cliBinaryPromise ??= (async () => {
    for (const candidate of cliCandidatePaths()) {
      if (candidate.includes("/")) {
        try {
          await access(candidate, constants.X_OK);
          return candidate;
        } catch {
          // try next
        }
      }
    }
    // Fall back to PATH resolution via spawn attempt marker.
    try {
      const { execFile } = await import("node:child_process");
      const { promisify } = await import("node:util");
      await promisify(execFile)("cmd", ["--version"], { timeout: 5000 });
      return "cmd";
    } catch {
      return null;
    }
  })();
  return cliBinaryPromise;
}

function askCli(binary: string, model: string, prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    mkdir(SANDBOX_DIR, { recursive: true })
      .then(() => {
        const child = spawn(
          binary,
          [
            "-p",
            prompt,
            "--model",
            model,
            "--skip-onboarding",
            "--no-session",
            "--max-turns",
            "5",
            "--output-format",
            "json",
            "-t",
          ],
          {
            cwd: SANDBOX_DIR,
            env: { ...process.env, DO_NOT_TRACK: "1" },
            stdio: ["ignore", "pipe", "pipe"],
          },
        );

        let stdout = "";
        let stderr = "";
        const timer = setTimeout(() => {
          child.kill("SIGKILL");
          reject(new Error(`cmd CLI timed out after ${CLI_TIMEOUT_MS} ms (${model}).`));
        }, CLI_TIMEOUT_MS);

        child.stdout.on("data", (chunk: Buffer) => {
          stdout += chunk.toString("utf8");
        });
        child.stderr.on("data", (chunk: Buffer) => {
          stderr += chunk.toString("utf8");
        });
        child.on("error", (error) => {
          clearTimeout(timer);
          reject(error);
        });
        child.on("close", (code) => {
          clearTimeout(timer);
          const finalText = extractFinalText(stdout);
          if (finalText) {
            resolve(finalText);
            return;
          }
          reject(
            new Error(
              `cmd CLI produced no answer for ${model} (exit ${code}). ${stderr
                .slice(-160)
                .trim()}`,
            ),
          );
        });
      })
      .catch(reject);
  });
}

function extractFinalText(ndjson: string): string | null {
  let best: string | null = null;
  for (const line of ndjson.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("{")) {
      continue;
    }
    try {
      const event = JSON.parse(trimmed) as {
        type?: string;
        event?: { type?: string; result?: { finalText?: string } };
      };
      const finalText = event.event?.result?.finalText;
      if (typeof finalText === "string" && finalText.trim()) {
        best = finalText;
      }
    } catch {
      // Not every stdout line is NDJSON; ignore.
    }
  }
  return best;
}

async function askHttp(
  apiKey: string,
  model: string,
  content: string | unknown[],
  timeoutMs = HTTP_TIMEOUT_MS,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(PROVIDER_CHAT_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content }],
      }),
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Provider API ${response.status} for ${model}: ${text.slice(0, 160)}`);
    }
    const parsed = JSON.parse(text) as {
      choices?: { message?: { content?: string } }[];
    };
    const content1 = parsed.choices?.[0]?.message?.content?.trim();
    if (!content1) {
      throw new Error(`Provider API returned empty content for ${model}.`);
    }
    return content1;
  } finally {
    clearTimeout(timer);
  }
}

export async function cmdApiKey(): Promise<string> {
  return resolveApiKey();
}

/**
 * Vision-capable call through the Provider API (OpenAI image_url parts with a
 * base64 data URL). Returns null when the API route is unavailable
 * (plan without API access, no key, or every model errored).
 */
export async function askCommandCodeVision(
  text: string,
  dataUrl: string,
  logTag = "cmd-vision",
): Promise<CmdAnswer | null> {
  const apiKey = await resolveApiKey();
  if (!apiKey || llmMode() === "cli" || llmMode() === "off") {
    return null;
  }

  for (const model of cmdModels()) {
    try {
      const answer = await askHttp(apiKey, model, [
        { type: "text", text },
        { type: "image_url", image_url: { url: dataUrl } },
      ]);
      return { text: answer, model, via: "cmd-http" };
    } catch (error) {
      console.warn(`[${logTag}] http ${model} failed:`, (error as Error).message);
    }
  }

  return null;
}

/**
 * Ask Command Code (CLI first, then Provider API) across the model chain.
 * Resolves null when the bridge is disabled or every model failed — the
 * caller decides its own fallback (e.g. deterministic memo).
 */
export async function askCommandCode(
  prompt: string,
  logTag = "cmd-llm",
  options?: { timeoutMs?: number; maxModels?: number },
): Promise<CmdAnswer | null> {
  const mode = llmMode();
  if (mode === "off") {
    return null;
  }

  const models = cmdModels().slice(0, options?.maxModels ?? Number.POSITIVE_INFINITY);
  const binary = mode === "http" ? null : await findCliBinary();

  for (const model of models) {
    if (binary && mode !== "http") {
      try {
        const text = await askCli(binary, model, prompt);
        return { text, model, via: "cmd-cli" };
      } catch (error) {
        console.warn(`[${logTag}] cli ${model} failed:`, (error as Error).message);
      }
    }

    if (mode !== "cli") {
      const apiKey = await resolveApiKey();
      if (!apiKey) {
        break;
      }
      try {
        const text = await askHttp(apiKey, model, prompt, options?.timeoutMs);
        return { text, model, via: "cmd-http" };
      } catch (error) {
        console.warn(`[${logTag}] http ${model} failed:`, (error as Error).message);
      }
    }
  }

  return null;
}

/** Pull the first balanced JSON object out of a model reply (fences tolerated). */
export function extractJsonObject(text: string): unknown | null {
  const start = text.indexOf("{");
  if (start === -1) {
    return null;
  }
  let depth = 0;
  for (let i = start; i < text.length; i += 1) {
    if (text[i] === "{") depth += 1;
    else if (text[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}
