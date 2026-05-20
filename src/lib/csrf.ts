/**
 * CSRF mitigation:Origin/Referer 検証
 * - POST/PATCH/PUT/DELETE 系 API で呼び出す
 * - クロスサイトからの不正リクエストを 403 で弾く
 *
 * Phase 3 Wave-B での発見:
 * 旧実装は SameSite=Lax cookie のみに依存していたため、
 * text/plain などで CORS preflight をトリガーしない方法で
 * 一部の POST が成立する可能性があった。
 */
import { type NextRequest, NextResponse } from "next/server";

export function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin") ?? req.headers.get("referer");
  if (!origin) {
    // server-to-server や fetch(无 origin) は怪しい → 拒否側
    return false;
  }
  try {
    const u = new URL(origin);
    return u.host === req.nextUrl.host;
  } catch {
    return false;
  }
}

/**
 * 非同期ハンドラの先頭で呼ぶ。same-origin でなければ 403 を直接返す。
 *   const csrf = assertSameOrigin(req);
 *   if (csrf) return csrf;
 */
export function assertSameOrigin(req: NextRequest): NextResponse | null {
  if (isSameOrigin(req)) return null;
  return NextResponse.json(
    { error: "csrf_check_failed" },
    { status: 403 },
  );
}
