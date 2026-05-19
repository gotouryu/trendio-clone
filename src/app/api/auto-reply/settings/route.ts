/**
 * GET  /api/auto-reply/settings — 自動応答設定を取得
 * PUT  /api/auto-reply/settings — 自動応答設定を更新
 *
 * 共P-01「無人受付」要件の中核設定:営業時間/FAQパターン/NGワード/デフォルト応答
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/supabase/requireUser";
import { createSupabaseServer } from "@/lib/supabase/server";
import { mockAutoReplySettings } from "@/lib/mockData";
import type { AutoReplySettings } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const sb = await createSupabaseServer();
  if (!sb) {
    // Supabase未設定時:モックを返してUI動作を可能にする(=デモ用)
    return NextResponse.json({ settings: mockAutoReplySettings, mock: true });
  }

  const { data, error } = await sb
    .from("auto_reply_settings")
    .select("*")
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    // 未作成なら初期値を挿入してそれを返す
    const init = mockAutoReplySettings;
    const { error: insertErr } = await sb.from("auto_reply_settings").insert({
      user_id: auth.userId,
      enabled: init.enabled,
      business_hours: init.businessHours,
      faq_patterns: init.faqPatterns,
      ng_keywords: init.ngKeywords,
      default_template: init.defaultTemplate,
    });
    if (insertErr) {
      return NextResponse.json({ settings: init, mock: false });
    }
    return NextResponse.json({ settings: init, mock: false });
  }

  const settings: AutoReplySettings = {
    enabled: data.enabled,
    businessHours: data.business_hours,
    faqPatterns: data.faq_patterns ?? [],
    ngKeywords: data.ng_keywords ?? [],
    defaultTemplate: data.default_template ?? "",
  };
  return NextResponse.json({ settings, mock: false });
}

export async function PUT(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const body = (await req.json()) as Partial<AutoReplySettings>;

  const sb = await createSupabaseServer();
  if (!sb) {
    return NextResponse.json({
      settings: { ...mockAutoReplySettings, ...body },
      mock: true,
    });
  }

  const payload: Record<string, unknown> = {
    user_id: auth.userId,
    updated_at: new Date().toISOString(),
  };
  if (typeof body.enabled === "boolean") payload.enabled = body.enabled;
  if (body.businessHours) payload.business_hours = body.businessHours;
  if (body.faqPatterns) payload.faq_patterns = body.faqPatterns;
  if (body.ngKeywords) payload.ng_keywords = body.ngKeywords;
  if (typeof body.defaultTemplate === "string")
    payload.default_template = body.defaultTemplate;

  const { data, error } = await sb
    .from("auto_reply_settings")
    .upsert(payload, { onConflict: "user_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const settings: AutoReplySettings = {
    enabled: data.enabled,
    businessHours: data.business_hours,
    faqPatterns: data.faq_patterns ?? [],
    ngKeywords: data.ng_keywords ?? [],
    defaultTemplate: data.default_template ?? "",
  };
  return NextResponse.json({ settings, mock: false });
}
