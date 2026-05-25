import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { assertSameOrigin } from "@/lib/csrf";
import { env, hasSupabase } from "@/lib/env";
import {
  checkPasswordResetRateLimit,
  recordPasswordResetAttempt,
} from "@/lib/loginRateLimit";

export const runtime = "nodejs";

function clientIp(req: NextRequest): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null
  );
}

function genericResponse() {
  return NextResponse.json({ ok: true });
}

async function constantDelay(startedAt: number) {
  const elapsed = Date.now() - startedAt;
  const waitMs = Math.max(0, 700 - elapsed);
  if (waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;

  let body: { email?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    await constantDelay(startedAt);
    return genericResponse();
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || email.length > 254) {
    await constantDelay(startedAt);
    return genericResponse();
  }

  const ip = clientIp(req);
  const rate = await checkPasswordResetRateLimit(email, ip);
  if (!rate.allowed) {
    await constantDelay(startedAt);
    return genericResponse();
  }

  await recordPasswordResetAttempt(email, ip);

  if (!hasSupabase()) {
    await constantDelay(startedAt);
    return genericResponse();
  }

  try {
    const sb = createClient(env.supabaseUrl!, env.supabaseAnonKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const redirectTo = `${env.appUrl.replace(/\/$/, "")}/reset-password`;
    await sb.auth.resetPasswordForEmail(email, { redirectTo });
  } catch {
    console.warn("[forgot password] reset request failed");
  }

  await constantDelay(startedAt);
  return genericResponse();
}
