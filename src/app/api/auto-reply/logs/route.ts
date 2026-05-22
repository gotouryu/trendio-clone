/**
 * GET /api/auto-reply/logs — 自動応答ログ一覧
 *
 * Query: ?limit=50&offset=0&status=sent|failed|blocked_ng
 * Response: { logs: AutoReplyLog[], totalCount: number, monthlyCount: number }
 *
 * 共P-01「対応漏れの可視化」要件:いつ・どの顧客に・何を自動応答したか全件追跡。
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/supabase/requireUser";
import { createSupabaseServer } from "@/lib/supabase/server";
import { mockAutoReplyLogs } from "@/lib/mockData";
import type { AutoReplyLog } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const pagination = parsePagination(searchParams, 50, 200);
  if (!pagination.ok) return pagination.response;
  const { limit, offset } = pagination;
  const statusFilter = searchParams.get("status");

  const sb = await createSupabaseServer();
  if (!sb) {
    let logs = mockAutoReplyLogs;
    if (statusFilter) logs = logs.filter((l) => l.status === statusFilter);
    return NextResponse.json({
      logs,
      totalCount: logs.length,
      monthlyCount: logs.length,
      mock: true,
    });
  }

  let query = sb
    .from("auto_reply_logs")
    .select("*", { count: "exact" })
    .eq("user_id", auth.userId)
    .order("replied_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (statusFilter) query = query.eq("status", statusFilter);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 当月集計(共P-01「対応漏れの可視化」用の月次サマリ)
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const { count: monthlyCount } = await sb
    .from("auto_reply_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", auth.userId)
    .gte("replied_at", monthStart.toISOString());

  const logs: AutoReplyLog[] = (data ?? []).map((row) => ({
    id: row.id,
    commentId: row.comment_id ?? "",
    customerHandle: row.customer_handle ?? "",
    customerAvatar: row.customer_avatar ?? "",
    originalComment: row.original_comment ?? "",
    generatedReply: row.generated_reply ?? "",
    matchedFaqId: row.matched_faq_id ?? undefined,
    matchedKeyword: row.matched_keyword ?? undefined,
    triggerReason: row.trigger_reason,
    repliedAt: row.replied_at,
    status: row.status,
  }));

  return NextResponse.json({
    logs,
    totalCount: count ?? logs.length,
    monthlyCount: monthlyCount ?? 0,
    mock: false,
  });
}

function parsePagination(
  searchParams: URLSearchParams,
  defaultLimit: number,
  maxLimit: number,
):
  | { ok: true; limit: number; offset: number }
  | { ok: false; response: NextResponse } {
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");
  const limit = limitParam === null ? defaultLimit : Number(limitParam);
  const offset = offsetParam === null ? 0 : Number(offsetParam);

  if (
    !Number.isInteger(limit) ||
    !Number.isInteger(offset) ||
    limit < 1 ||
    limit > maxLimit ||
    offset < 0 ||
    offset > 100000
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `limit must be 1-${maxLimit} and offset must be 0-100000` },
        { status: 400 },
      ),
    };
  }

  return { ok: true, limit, offset };
}
