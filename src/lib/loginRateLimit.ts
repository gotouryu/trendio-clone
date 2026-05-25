import { createHash } from "node:crypto";
import { createSupabaseAdmin } from "./supabase/admin";

type LoginRateLimitCheck = {
  allowed: boolean;
  retryAfterSec?: number;
};

type Counter = { window_started_at: string; count: number };

const WINDOW_SEC = 15 * 60;
const LIMITS = {
  ip: 30,
  email: 8,
  pair: 5,
} as const;

const memoryCounters = new Map<string, Counter>();

function hashPart(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

function rateKey(kind: keyof typeof LIMITS, value: string): string {
  return `login:${kind}:${hashPart(value)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function secondsUntilReset(startedAt: string): number {
  const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000;
  return Math.max(1, Math.ceil(WINDOW_SEC - elapsed));
}

async function readKey(key: string) {
  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("login_attempt_rate_limits")
    .select("window_started_at, count")
    .eq("key", key)
    .maybeSingle();
  if (error) throw error;
  return data as { window_started_at: string; count: number } | null;
}

async function incrementKey(key: string) {
  const sb = createSupabaseAdmin();
  const current = await readKey(key);
  const ts = nowIso();

  if (!current) {
    const { error } = await sb
      .from("login_attempt_rate_limits")
      .upsert({ key, window_started_at: ts, count: 1 }, { onConflict: "key" });
    if (error) throw error;
    return;
  }

  const elapsed = (Date.now() - new Date(current.window_started_at).getTime()) / 1000;
  const next =
    elapsed >= WINDOW_SEC
      ? { window_started_at: ts, count: 1 }
      : { window_started_at: current.window_started_at, count: current.count + 1 };

  const { error } = await sb
    .from("login_attempt_rate_limits")
    .update(next)
    .eq("key", key);
  if (error) throw error;
}

async function resetKey(key: string) {
  const sb = createSupabaseAdmin();
  const { error } = await sb.from("login_attempt_rate_limits").delete().eq("key", key);
  if (error) throw error;
}

function checkMemoryKey(key: string, limit: number): LoginRateLimitCheck {
  const current = memoryCounters.get(key);
  if (!current) return { allowed: true };

  const elapsed = (Date.now() - new Date(current.window_started_at).getTime()) / 1000;
  if (elapsed >= WINDOW_SEC) {
    memoryCounters.delete(key);
    return { allowed: true };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfterSec: secondsUntilReset(current.window_started_at),
    };
  }
  return { allowed: true };
}

function checkMemory(keys: ReturnType<typeof keysForAttempt>): LoginRateLimitCheck {
  for (const item of keys) {
    const result = checkMemoryKey(item.key, item.limit);
    if (!result.allowed) return result;
  }
  return { allowed: true };
}

function incrementMemory(keys: ReturnType<typeof keysForAttempt>) {
  for (const item of keys) {
    const current = memoryCounters.get(item.key);
    const ts = nowIso();
    if (!current) {
      memoryCounters.set(item.key, { window_started_at: ts, count: 1 });
      continue;
    }

    const elapsed = (Date.now() - new Date(current.window_started_at).getTime()) / 1000;
    memoryCounters.set(
      item.key,
      elapsed >= WINDOW_SEC
        ? { window_started_at: ts, count: 1 }
        : { window_started_at: current.window_started_at, count: current.count + 1 },
    );
  }
}

function resetMemory(keys: ReturnType<typeof keysForAttempt>) {
  for (const item of keys) memoryCounters.delete(item.key);
}

function keysForAttempt(email: string, ip: string | null) {
  const normalizedIp = ip || "unknown";
  return [
    { key: rateKey("ip", normalizedIp), limit: LIMITS.ip },
    { key: rateKey("email", email), limit: LIMITS.email },
    { key: rateKey("pair", `${normalizedIp}:${email}`), limit: LIMITS.pair },
  ];
}

export async function checkLoginRateLimit(
  email: string,
  ip: string | null,
): Promise<LoginRateLimitCheck> {
  const keys = keysForAttempt(email, ip);
  try {
    for (const item of keys) {
      const current = await readKey(item.key);
      if (!current) continue;

      const elapsed =
        (Date.now() - new Date(current.window_started_at).getTime()) / 1000;
      if (elapsed >= WINDOW_SEC) continue;
      if (current.count >= item.limit) {
        return {
          allowed: false,
          retryAfterSec: secondsUntilReset(current.window_started_at),
        };
      }
    }
  } catch {
    console.warn("[auth login] rate limit check unavailable");
    return checkMemory(keys);
  }

  return { allowed: true };
}

export async function recordFailedLogin(email: string, ip: string | null) {
  const keys = keysForAttempt(email, ip);
  try {
    await Promise.all(keys.map((item) => incrementKey(item.key)));
  } catch {
    console.warn("[auth login] rate limit record unavailable");
    incrementMemory(keys);
  }
}

export async function clearLoginRateLimit(email: string, ip: string | null) {
  const keys = keysForAttempt(email, ip);
  try {
    await Promise.all(keys.map((item) => resetKey(item.key)));
  } catch {
    console.warn("[auth login] rate limit reset unavailable");
    resetMemory(keys);
  }
}
