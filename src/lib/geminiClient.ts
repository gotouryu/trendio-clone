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

/**
 * Gemini 2.5 Flash-Lite でテキスト生成する。
 * json=true で responseMimeType を application/json にして JSON 強制。
 */
export async function runGemini(opts: {
  system: string;
  user: string;
  maxTokens?: number;
  json?: boolean;
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
    },
  });
  return resp.text ?? "";
}
