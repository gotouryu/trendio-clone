import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

/**
 * Next.js 16 の proxy(=旧 middleware 相当)。
 * - Supabase Auth cookie の rotation を毎リクエストで実行
 * - /ai-content および /api/ai-content は IT導入補助金審査用に非公開化(=採択後に
 *   `NEXT_PUBLIC_ENABLE_AI_CONTENT=true` で復活させる想定。コード本体は残置)
 */
const AI_CONTENT_ENABLED = process.env.NEXT_PUBLIC_ENABLE_AI_CONTENT === "true";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // updateSession を先に走らせ Supabase Auth cookie の rotation を必ず行う。
  // (=旧実装は /ai-content の 404 を updateSession 前で返していたため、
  //   ai-content フラグ復活時に当該パスだけ cookie refresh をスキップする
  //   不整合があった。先に refresh → その後フラグ判定で 404 を返す。)
  const sessionResponse = await updateSession(request);

  // /ai-content と /api/ai-content をフラグ式で 404 化
  // (=URL 直打ち防止、申請審査時の対象外条項(イ・シ・セ)抵触を回避)
  if (
    !AI_CONTENT_ENABLED &&
    (pathname === "/ai-content" ||
      pathname.startsWith("/ai-content/") ||
      pathname === "/api/ai-content" ||
      pathname.startsWith("/api/ai-content/"))
  ) {
    return new NextResponse(null, { status: 404 });
  }

  return sessionResponse;
}

export const config = {
  // _next/data も除外(=RSC payload リクエスト用、ここに proxy を噛ますと
  // 静的データ取得が壊れる)
  matcher: [
    "/((?!_next/static|_next/image|_next/data|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
