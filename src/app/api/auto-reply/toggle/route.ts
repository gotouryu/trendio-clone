/**
 * POST /api/auto-reply/toggle — 自動応答モードのON/OFFを瞬時に切り替え
 *
 * Body: { enabled: boolean }
 * Response: { enabled: boolean }
 *
 * 共P-01「無人受付」要件の最重要操作:1クリックで無人受付モードに切替可能。
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/supabase/requireUser";
import { createSupabaseServer } from "@/lib/supabase/server";
import { assertSameOrigin } from "@/lib/csrf";
import { enforceUserRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const rateLimit = await enforceUserRateLimit({
    userId: auth.userId,
    kind: "auto_reply_toggle",
    windowSec: 60,
    maxInWindow: 30,
  });
  if (rateLimit) return rateLimit;

  let body: { enabled?: boolean };
  try {
    body = (await req.json()) as { enabled?: boolean };
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (typeof body.enabled !== "boolean") {
    return NextResponse.json(
      { error: "enabled (boolean) is required" },
      { status: 400 },
    );
  }

  const sb = await createSupabaseServer();
  if (!sb) {
    return NextResponse.json({ enabled: body.enabled, mock: true });
  }

  const { data, error } = await sb
    .from("auto_reply_settings")
    .upsert(
      {
        user_id: auth.userId,
        enabled: body.enabled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("enabled")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ enabled: data.enabled, mock: false });
}
