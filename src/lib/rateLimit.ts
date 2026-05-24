/**
 * AI route 用レートリミット(=H3 残対応、Upstash 未取得のため Supabase ベース)
 *
 * 方式:Fixed Window
 *   - user_id × kind ごとに window_started_at と count を保持
 *   - 経過時間が windowSec 超えたら新ウィンドウに切替(count=1)
 *   - count >= maxInWindow なら 429 相当を返す
 *
 * DB:`public.rate_limits`(=db/migrations/2026-05-21_rate_limits.sql で作成)
 *
 * 注意:Service Role 経由(=createSupabaseAdmin)で書く。
 *       RLS bypass が必要(=user_id を別ユーザーで書く設計ではないが、
 *       count UPDATE は user_id を where 句で絞るため安全)。
 */
import { createSupabaseAdmin } from "./supabase/admin";
import { hasSupabase } from "./env";
import { NextResponse } from "next/server";

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSec: number; unavailable?: boolean };

function unavailableRateLimit(): RateLimitResult {
  return { allowed: false, retryAfterSec: 60, unavailable: true };
}

function allowWhenNotProduction(): RateLimitResult {
  return process.env.NODE_ENV === "production"
    ? unavailableRateLimit()
    : { allowed: true };
}

export async function consumeRateLimit({
  userId,
  kind,
  windowSec,
  maxInWindow,
}: {
  userId: string;
  kind: string;
  windowSec: number;
  maxInWindow: number;
}): Promise<RateLimitResult> {
  if (!hasSupabase()) return allowWhenNotProduction();

  let sb;
  try {
    sb = createSupabaseAdmin();
  } catch {
    return allowWhenNotProduction();
  }

  const now = new Date();
  const nowIso = now.toISOString();

  const { data, error } = await sb
    .from("rate_limits")
    .select("window_started_at, count")
    .eq("user_id", userId)
    .eq("kind", kind)
    .maybeSingle();

  if (error) {
    console.warn("[rateLimit] select failed");
    return allowWhenNotProduction();
  }

  if (!data) {
    // 初回:INSERT
    const { error: upsertError } = await sb.from("rate_limits").upsert(
      {
        user_id: userId,
        kind,
        window_started_at: nowIso,
        count: 1,
      },
      { onConflict: "user_id,kind" },
    );
    if (upsertError) {
      console.warn("[rateLimit] upsert failed");
      return allowWhenNotProduction();
    }
    return { allowed: true };
  }

  const windowStartMs = new Date(data.window_started_at).getTime();
  const elapsedSec = (now.getTime() - windowStartMs) / 1000;

  if (elapsedSec >= windowSec) {
    // 新ウィンドウ開始(=count を 1 にリセット)
    const { error: updateError } = await sb
      .from("rate_limits")
      .update({
        window_started_at: nowIso,
        count: 1,
      })
      .eq("user_id", userId)
      .eq("kind", kind);
    if (updateError) {
      console.warn("[rateLimit] reset failed");
      return allowWhenNotProduction();
    }
    return { allowed: true };
  }

  if (data.count >= maxInWindow) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil(windowSec - elapsedSec)),
    };
  }

  // ウィンドウ内 + 上限未満:インクリメント
  const { error: incrementError } = await sb
    .from("rate_limits")
    .update({ count: data.count + 1 })
    .eq("user_id", userId)
    .eq("kind", kind);
  if (incrementError) {
    console.warn("[rateLimit] increment failed");
    return allowWhenNotProduction();
  }
  return { allowed: true };
}

export async function enforceUserRateLimit({
  userId,
  kind,
  windowSec,
  maxInWindow,
}: {
  userId: string;
  kind: string;
  windowSec: number;
  maxInWindow: number;
}): Promise<NextResponse | null> {
  const rate = await consumeRateLimit({
    userId,
    kind,
    windowSec,
    maxInWindow,
  });
  if (rate.allowed) return null;
  if (rate.unavailable) {
    return NextResponse.json(
      {
        error: "rate_limit_unavailable",
        retryAfterSec: rate.retryAfterSec,
      },
      {
        status: 503,
        headers: { "Retry-After": String(rate.retryAfterSec) },
      },
    );
  }
  return NextResponse.json(
    {
      error: "rate_limited",
      retryAfterSec: rate.retryAfterSec,
    },
    {
      status: 429,
      headers: { "Retry-After": String(rate.retryAfterSec) },
    },
  );
}
