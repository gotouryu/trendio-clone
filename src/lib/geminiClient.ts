import { GoogleGenAI } from "@google/genai";
import { env, hasGemini } from "./env";

let cached: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI | null {
  if (!hasGemini()) return null;
  if (cached) return cached;
  cached = new GoogleGenAI({ apiKey: env.geminiApiKey! });
  return cached;
}

export const GEMINI_MODEL = env.geminiModel;

/** Gemini でテキスト生成する。JSON時はschemaも渡せる。 */
export async function runGemini(opts: {
  system: string;
  user: string;
  maxTokens?: number;
  json?: boolean;
  responseJsonSchema?: unknown;
}): Promise<string> {
  const client = getGemini();
  if (!client) {
    throw new Error(
      "Gemini API key not configured. Set GEMINI_API_KEY in .env.local",
    );
  }
  const resp = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: opts.user,
    config: {
      systemInstruction: opts.system,
      maxOutputTokens: opts.maxTokens ?? 2048,
      ...(opts.json ? { responseMimeType: "application/json" } : {}),
      ...(opts.responseJsonSchema
        ? { responseJsonSchema: opts.responseJsonSchema }
        : {}),
    },
  });
  return resp.text ?? "";
}
