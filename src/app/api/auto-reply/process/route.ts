/**
 * POST /api/auto-reply/process — 新規コメントを自動応答処理する
 *
 * Body: { commentId: string, commentText: string, customerHandle: string, customerAvatar?: string, customerId?: string }
 * Response: { status: 'sent'|'skipped'|'blocked_ng'|'failed'|'duplicate', logId?: string, reply?: string, reason?: string }
 *
 * 共P-01「無人受付」の中核ロジック(=機能説明資料 P.5 設定条件 営業時間外・FAQ該当等):
 * 0. 同 comment_id で既に sent ログがあれば duplicate でスキップ(=冪等性)
 * 1. 自動応答モードOFFならスキップ
 * 2. NGワード含むなら blocked_ng でログのみ残す(=Human-in-the-Loop)
 * 3. FAQマッチがあれば営業時間内外問わず応答(=共P-01 設定条件「FAQ該当」)
 *    - triggerReason は 営業時間内なら faq_match、時間外なら business_hours_out
 * 4. FAQ非該当 + 営業時間外 + デフォルトテンプレあり → デフォルト応答
 * 5. それ以外(=営業時間内かつFAQ非該当)はスキップ(=人間が手動応答する)
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/supabase/requireUser";
import { createSupabaseServer } from "@/lib/supabase/server";
import { assertSameOrigin } from "@/lib/csrf";
import { enforceUserRateLimit } from "@/lib/rateLimit";
import { mockAutoReplySettings } from "@/lib/mockData";
import type { AutoReplySettings, FaqPattern } from "@/lib/types";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const rateLimit = await enforceUserRateLimit({
    userId: auth.userId,
    kind: "auto_reply_process",
    windowSec: 60,
    maxInWindow: 120,
  });
  if (rateLimit) return rateLimit;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (!body.commentText || !body.commentId || !body.customerHandle) {
    return NextResponse.json(
      { error: "commentId, commentText, customerHandle required" },
      { status: 400 },
    );
  }
  if (
    typeof body.commentId !== "string" ||
    typeof body.commentText !== "string" ||
    typeof body.customerHandle !== "string" ||
    body.commentId.length > 120 ||
    body.commentText.length > 2000 ||
    body.customerHandle.length > 100
  ) {
    return NextResponse.json({ error: "invalid comment payload" }, { status: 400 });
  }
  if (body.customerId && !UUID_RE.test(body.customerId)) {
    return NextResponse.json({ error: "invalid customerId" }, { status: 400 });
  }

  const sb = await createSupabaseServer();

  // 冪等性:同 comment_id で既に sent ログがあれば多重応答を防ぐ
  if (sb) {
    const { data: existingLog } = await sb
      .from("auto_reply_logs")
      .select("id, status")
      .eq("user_id", auth.userId)
      .eq("comment_id", body.commentId)
      .in("status", ["sent", "blocked_ng"])
      .maybeSingle();
    if (existingLog) {
      return NextResponse.json({
        status: "skipped",
        reason: "duplicate_comment_id",
        logId: existingLog.id,
      });
    }
  }

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

  // customer_id の所有確認(=列挙攻撃防御、自分の顧客以外は触れない)
  // 検証成功時は customer_handle も body の自己申告ではなく DB の値で上書き
  // (=なりすまし防止:body.customerHandle に他人のハンドルを書かれてもログに記録されない)
  let verifiedCustomerId: string | null = null;
  let verifiedCustomerHandle: string = body.customerHandle;
  if (sb && body.customerId) {
    const { data: ownCustomer } = await sb
      .from("customers")
      .select("id, instagram_handle")
      .eq("id", body.customerId)
      .eq("user_id", auth.userId)
      .maybeSingle();
    if (ownCustomer) {
      verifiedCustomerId = ownCustomer.id;
      verifiedCustomerHandle = ownCustomer.instagram_handle;
    }
  }

  // ログ保存(=共P-01 5年間ログ保管要件)
  // skipped でも履歴は残す(=共P-01「顧客行動履歴」要件、no_match/business_hours_out 等の
  // 判定根拠も後から監査できるようにする)
  if (sb) {
    const { data: logRow, error: logErr } = await sb
      .from("auto_reply_logs")
      .insert({
        user_id: auth.userId,
        comment_id: body.commentId,
        customer_id: verifiedCustomerId,
        customer_handle: verifiedCustomerHandle,
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

    // UNIQUE 違反(=23505)はレース時の重複 INSERT。冪等性 OK として skipped 扱いで返す
    if (logErr) {
      const code: string | undefined = logErr.code;
      if (code === "23505") {
        return NextResponse.json({
          status: "skipped",
          reason: "duplicate_comment_id_race",
        });
      }
      if (
        result.status === "skipped" &&
        /violates check constraint|invalid input value/i.test(logErr.message)
      ) {
        return NextResponse.json({
          ...result,
          logPersisted: false,
          warning: "AUTO_REPLY_SKIPPED_LOG_FALLBACK",
        });
      }
      return NextResponse.json(
        { ...result, logPersisted: false, warning: "AUTO_REPLY_LOG_FALLBACK" },
        { status: 200 },
      );
    }

    // 接点履歴(customer_interactions)にも追記(=共P-01 顧客行動履歴)
    // 所有確認済みの customer_id のみ INSERT する(=トリガー bump_customer_aggregate が安全に走る)
    // schema CHECK 制約: type ∈ ('comment','reply_auto','reply_manual','like','save')
    //                     handled_by ∈ ('ai','human')
    // → status に関係なく「顧客がコメントした事実」は type='comment' で記録
    //    sent の時のみ追加で「AIが返信した事実」を type='reply_auto' で記録
    if (verifiedCustomerId) {
      const rows: Record<string, unknown>[] = [
        {
          user_id: auth.userId,
          customer_id: verifiedCustomerId,
          type: "comment",
          content: body.commentText,
          handled_by: "ai",
          related_comment_id: body.commentId,
        },
      ];
      if (result.status === "sent" && result.reply) {
        rows.push({
          user_id: auth.userId,
          customer_id: verifiedCustomerId,
          type: "reply_auto",
          content: result.reply,
          handled_by: "ai",
          related_comment_id: body.commentId,
        });
      }
      await sb.from("customer_interactions").insert(rows);
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
/**
 * Phase 3 Wave-D 修正:NFKC 正規化 + 大文字小文字無視で
 * 「ク レーム」「クレ-ム」「ク💢レーム」のようなバイパスを防止
 *
 * Human-in-the-Loop 担保:Karteia の中核セキュリティ機能
 */
function normalizeForMatch(s: string): string {
  return s
    .normalize("NFKC")
    .toLowerCase()
    // 制御文字・絵文字変位選択子・ゼロ幅文字を除去
    .replace(/[​-‍﻿︎️]/g, "")
    // 単純な英字の区切り記号(=ハイフン・スペース)を除去して「ク レーム」も「クレーム」とみなす
    .replace(/[\s\-_]+/g, "");
}

/** Karteia 標準内蔵 NG ワード辞書(=ユーザー追加分とマージして判定) */
const BUILT_IN_NG_KEYWORDS = [
  "クレーム",
  "返金",
  "弁護士",
  "訴える",
  "complaint",
  "refund",
  "lawyer",
  "lawsuit",
];

export function processComment(
  text: string,
  settings: AutoReplySettings,
  now: Date = new Date(),
): ProcessResult {
  if (!settings.enabled) {
    return { status: "skipped", reason: "auto_reply_mode_off" };
  }

  // 1. NGワード判定(=最優先、Phase 3 Wave-D 強化:NFKC + 内蔵辞書 + 区切り無視)
  const normalizedText = normalizeForMatch(text);
  const allNgKeywords = [...BUILT_IN_NG_KEYWORDS, ...settings.ngKeywords];
  const ngHit = allNgKeywords.find((kw) =>
    normalizedText.includes(normalizeForMatch(kw)),
  );
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

  // 3. FAQパターンマッチ(=長いキーワード優先、Phase 3 Wave-D 修正)
  const faqHit = matchFaqPattern(text, settings.faqPatterns);
  if (faqHit) {
    // Phase 3 Wave-D 修正:FAQ ヒットは時間に関係なく faq_match で固定
    // (=旧実装は時間外で business_hours_out になり、ログ集計時に二重カウント発生)
    return {
      status: "sent",
      reply: faqHit.reply,
      matchedFaqId: faqHit.id,
      matchedKeyword: faqHit.keyword,
      triggerReason: "faq_match",
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

/**
 * FAQ パターンマッチ(=Phase 3 Wave-D 修正)
 * - NFKC 正規化 + 大文字小文字無視
 * - 長いキーワード優先(=「営業時間外」が「営業時間」より先にマッチする)
 */
function matchFaqPattern(
  text: string,
  patterns: FaqPattern[],
): FaqPattern | null {
  const normalizedText = normalizeForMatch(text);
  // 有効パターンのみ + キーワード長で降順ソート
  const enabled = patterns
    .filter((p) => p.enabled)
    .sort((a, b) => b.keyword.length - a.keyword.length);
  for (const p of enabled) {
    if (normalizedText.includes(normalizeForMatch(p.keyword))) return p;
  }
  return null;
}
