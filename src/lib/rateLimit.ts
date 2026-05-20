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

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSec: number };

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
  // Supabase 未設定なら制限なしで通す(=デモ環境用)
  if (!hasSupabase()) return { allowed: true };

  let sb;
  try {
    sb = createSupabaseAdmin();
  } catch {
    // service role key 未設定:制限なしで通す(=デモ環境)
    return { allowed: true };
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
    // テーブル未作成等のエラーは制限なしで通す(=fail-open、運用者がログで気付く)
    console.warn("[rateLimit] select failed:", error.message);
    return { allowed: true };
  }

  if (!data) {
    // 初回:INSERT
    await sb.from("rate_limits").upsert(
      {
        user_id: userId,
        kind,
        window_started_at: nowIso,
        count: 1,
      },
      { onConflict: "user_id,kind" },
    );
    return { allowed: true };
  }

  const windowStartMs = new Date(data.window_started_at).getTime();
  const elapsedSec = (now.getTime() - windowStartMs) / 1000;

  if (elapsedSec >= windowSec) {
    // 新ウィンドウ開始(=count を 1 にリセット)
    await sb
      .from("rate_limits")
      .update({
        window_started_at: nowIso,
        count: 1,
      })
      .eq("user_id", userId)
      .eq("kind", kind);
    return { allowed: true };
  }

  if (data.count >= maxInWindow) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil(windowSec - elapsedSec)),
    };
  }

  // ウィンドウ内 + 上限未満:インクリメント
  await sb
    .from("rate_limits")
    .update({ count: data.count + 1 })
    .eq("user_id", userId)
    .eq("kind", kind);
  return { allowed: true };
}
