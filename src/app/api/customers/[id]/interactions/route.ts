/**
 * GET /api/customers/[id]/interactions — 顧客の接点履歴(時系列)
 *
 * Query: ?limit=100&offset=0
 * Response: { interactions: CustomerInteraction[], totalCount: number, byCategoryCount: {...} }
 *
 * 共P-01「顧客行動履歴の自動蓄積」要件:全てのコメント・AI応答・手動応答を時系列で表示
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/supabase/requireUser";
import { createSupabaseServer } from "@/lib/supabase/server";
import { mockInteractions } from "@/lib/mockData";
import type { CustomerInteraction, InquiryCategory } from "@/lib/types";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "100", 10), 500);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const sb = await createSupabaseServer();
  if (!sb || !UUID_RE.test(id)) {
    const list = mockInteractions
      .filter((i) => i.customerId === id)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    return NextResponse.json({
      interactions: list.slice(offset, offset + limit),
      totalCount: list.length,
      byCategoryCount: countByCategory(list),
      mock: true,
    });
  }

  const { data, count, error } = await sb
    .from("customer_interactions")
    .select("*", { count: "exact" })
    .eq("customer_id", id)
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const interactions: CustomerInteraction[] = (data ?? []).map((row) => ({
    id: row.id,
    customerId: row.customer_id,
    type: row.type,
    content: row.content ?? "",
    category: row.category ?? undefined,
    createdAt: row.created_at,
    relatedCommentId: row.related_comment_id ?? undefined,
    handledBy: row.handled_by ?? undefined,
    status: row.status ?? undefined,
  }));

  // 問い合わせカテゴリ集計(=共P-01「顧客接点の構造化」要件)
  const { data: categoryRows } = await sb
    .from("customer_interactions")
    .select("category")
    .eq("customer_id", id)
    .eq("user_id", auth.userId);

  const byCategoryCount = countByCategory(
    (categoryRows ?? []).map((r) => ({
      category: r.category as InquiryCategory | undefined,
    })),
  );

  return NextResponse.json({
    interactions,
    totalCount: count ?? interactions.length,
    byCategoryCount,
    mock: false,
  });
}

function countByCategory(
  list: Array<{ category?: InquiryCategory }>,
): Record<InquiryCategory, number> {
  const init: Record<InquiryCategory, number> = {
    product_inquiry: 0,
    business_hours: 0,
    complaint: 0,
    positive: 0,
    other: 0,
  };
  for (const item of list) {
    const cat = item.category ?? "other";
    init[cat] = (init[cat] ?? 0) + 1;
  }
  return init;
}
