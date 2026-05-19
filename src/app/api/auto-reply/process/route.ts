/**
 * POST /api/auto-reply/process — 新規コメントを自動応答処理する
 *
 * Body: { commentId: string, commentText: string, customerHandle: string, customerAvatar?: string, customerId?: string }
 * Response: { status: 'sent'|'skipped'|'blocked_ng'|'failed', logId?: string, reply?: string, reason?: string }
 *
 * 共P-01「無人受付」の中核ロジック:
 * 1. 自動応答モードOFFならスキップ
 * 2. NGワード含むなら blocked_ng でログのみ残す
 * 3. 営業時間内 + FAQマッチ なら即時応答(=faq_match)
 * 4. 営業時間外なら、FAQマッチまたはデフォルト応答(=business_hours_out)
 * 5. それ以外はスキップ
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/supabase/requireUser";
import { createSupabaseServer } from "@/lib/supabase/server";
import { mockAutoReplySettings } from "@/lib/mockData";
import type { AutoReplySettings, FaqPattern } from "@/lib/types";

export const runtime = "nodejs";

type Body = {
  commentId: string;
  commentText: string;
  customerHandle: string;
  customerAvatar?: string;
  customerId?: string;
};

type ProcessResult = {
  status: "sent" | "skipped" | "blocked_ng" | "failed";
  reply?: string;
  reason?: string;
  matchedFaqId?: string;
  matchedKeyword?: string;
  triggerReason?: "business_hours_out" | "faq_match" | "manual_trigger";
};

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const body = (await req.json()) as Body;
  if (!body.commentText || !body.commentId || !body.customerHandle) {
    return NextResponse.json(
      { error: "commentId, commentText, customerHandle required" },
      { status: 400 },
    );
  }

  const sb = await createSupabaseServer();

  // 設定取得
  let settings: AutoReplySettings = mockAutoReplySettings;
  if (sb) {
    const { data } = await sb
      .from("auto_reply_settings")
      .select("*")
      .eq("user_id", auth.userId)
      .maybeSingle();
    if (data) {
      settings = {
        enabled: data.enabled,
        businessHours: data.business_hours,
        faqPatterns: data.faq_patterns ?? [],
        ngKeywords: data.ng_keywords ?? [],
        defaultTemplate: data.default_template ?? "",
      };
    }
  }

  const result = processComment(body.commentText, settings);

  // ログ保存(=共P-01 5年間ログ保管要件)
  if (sb && result.status !== "skipped") {
    const { data: logRow } = await sb
      .from("auto_reply_logs")
      .insert({
        user_id: auth.userId,
        comment_id: body.commentId,
        customer_id: body.customerId ?? null,
        customer_handle: body.customerHandle,
        customer_avatar: body.customerAvatar,
        original_comment: body.commentText,
        generated_reply: result.reply ?? "",
        matched_faq_id: result.matchedFaqId ?? null,
        matched_keyword: result.matchedKeyword ?? null,
        trigger_reason: result.triggerReason ?? "manual_trigger",
        status: result.status,
      })
      .select("id")
      .single();

    // 接点履歴(customer_interactions)にも追記(=共P-01 顧客行動履歴)
    if (result.status === "sent" && body.customerId) {
      await sb.from("customer_interactions").insert({
        user_id: auth.userId,
        customer_id: body.customerId,
        type: "reply_auto",
        content: result.reply,
        handled_by: "ai",
        related_comment_id: body.commentId,
      });
    }

    return NextResponse.json({ ...result, logId: logRow?.id });
  }

  // モックモード(Supabase未設定時)
  return NextResponse.json({ ...result, logId: `mock-${Date.now()}` });
}

/**
 * 自動応答処理のコアロジック(=共P-01「無人受付」判定)
 * 副作用なし、ユニットテスト可能。
 */
export function processComment(
  text: string,
  settings: AutoReplySettings,
  now: Date = new Date(),
): ProcessResult {
  if (!settings.enabled) {
    return { status: "skipped", reason: "auto_reply_mode_off" };
  }

  // 1. NGワード判定(=最優先)
  const ngHit = settings.ngKeywords.find((kw) => text.includes(kw));
  if (ngHit) {
    return {
      status: "blocked_ng",
      reason: `ng_keyword_matched: ${ngHit}`,
      triggerReason: "manual_trigger",
      matchedKeyword: ngHit,
    };
  }

  // 2. 営業時間判定
  const inBusinessHours = settings.businessHours.enabled
    ? isWithinBusinessHours(now, settings.businessHours)
    : true;

  // 3. FAQパターンマッチ
  const faqHit = matchFaqPattern(text, settings.faqPatterns);
  if (faqHit) {
    return {
      status: "sent",
      reply: faqHit.reply,
      matchedFaqId: faqHit.id,
      matchedKeyword: faqHit.keyword,
      triggerReason: inBusinessHours ? "faq_match" : "business_hours_out",
    };
  }

  // 4. 営業時間外+デフォルト応答あり
  if (!inBusinessHours && settings.defaultTemplate.trim()) {
    return {
      status: "sent",
      reply: settings.defaultTemplate,
      triggerReason: "business_hours_out",
    };
  }

  // 5. 営業時間内+FAQヒットなし=スキップ(=人間が手動応答する想定)
  return { status: "skipped", reason: "no_match_in_business_hours" };
}

function isWithinBusinessHours(
  now: Date,
  bh: AutoReplySettings["businessHours"],
): boolean {
  // タイムゾーン考慮(=Asia/Tokyo 固定でJSTの時刻を取り出す)
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: bh.timezone || "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const hour = parseInt(
    parts.find((p) => p.type === "hour")?.value ?? "0",
    10,
  );
  const minute = parseInt(
    parts.find((p) => p.type === "minute")?.value ?? "0",
    10,
  );
  const cur = hour * 60 + minute;
  const [sh, sm] = bh.start.split(":").map((v) => parseInt(v, 10));
  const [eh, em] = bh.end.split(":").map((v) => parseInt(v, 10));
  return cur >= sh * 60 + sm && cur < eh * 60 + em;
}

function matchFaqPattern(text: string, patterns: FaqPattern[]): FaqPattern | null {
  for (const p of patterns) {
    if (!p.enabled) continue;
    if (text.includes(p.keyword)) return p;
  }
  return null;
}
