import Anthropic from "@anthropic-ai/sdk";
import { env, hasAnthropic } from "./env";
import { AI_API_TIMEOUT_MS, withTimeout } from "./timeout";

let cached: Anthropic | null = null;

export function getAnthropic(): Anthropic | null {
  if (!hasAnthropic()) return null;
  if (cached) return cached;
  cached = new Anthropic({ apiKey: env.anthropicApiKey });
  return cached;
}

export const CLAUDE_MODEL = env.claudeModel;

/**
 * Run Claude with prompt caching enabled for the system prompt.
 * Returns the assistant's full text output.
 */
export async function runClaude(opts: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<string> {
  const client = getAnthropic();
  if (!client) {
    throw new Error(
      "Anthropic API key not configured. Set ANTHROPIC_API_KEY in .env.local",
    );
  }
  const resp = await withTimeout(
    client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: opts.maxTokens ?? 2048,
      system: [
        {
          type: "text",
          text: opts.system,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: opts.user }],
    }),
    AI_API_TIMEOUT_MS,
    "Claude generation",
  );
  const text = resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  return text;
}
