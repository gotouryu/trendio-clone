import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env, hasSupabase } from "./lib/env";

/**
 * Next.js 16 の proxy(=旧 middleware 相当)。
 *
 * 役割:
 * 1. Supabase Auth cookie の rotation を毎リクエストで実行
 * 2. /dashboard /comments /customers /settings /admin 配下を **path-based でガード**
 *    (=未認証アクセスを /login or /portal-helix-2026/login にリダイレクト)
 * 3. /ai-content および /api/ai-content を IT導入補助金審査用にフラグ式 404 化
 *
 * Phase 3 Wave-C 修正点(=Agent C Critical C-3):
 * - 旧実装は updateSession で cookie rotate するだけで、未認証 HTML 配信を許していた
 * - Server Component が個人情報を直接埋め込むようになれば即漏洩する穴があった
 * - middleware で path-based に弾く設計に変更
 */
const AI_CONTENT_ENABLED = process.env.NEXT_PUBLIC_ENABLE_AI_CONTENT === "true";

/** 認証必須のパス prefix(=未認証なら /login へ) */
const CUSTOMER_PROTECTED_PREFIXES = [
  "/dashboard",
  "/comments",
  "/customers",
  "/settings",
];

/** 管理者ロール必須のパス prefix(=未認証 or 非adminなら /portal-helix-2026/login へ) */
const ADMIN_PROTECTED_PREFIXES = ["/admin"];

function pathMatchesPrefix(
  pathname: string,
  prefixes: readonly string[],
): boolean {
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ベースとなる response を作成 + Supabase cookie rotation
  let response = NextResponse.next({ request });

  if (!hasSupabase()) {
    // Supabase 未設定:OAuth 関連と data-deletion 以外は素通り
    // ただし保護パスは未認証扱いで弾く
    if (pathMatchesPrefix(pathname, CUSTOMER_PROTECTED_PREFIXES)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (pathMatchesPrefix(pathname, ADMIN_PROTECTED_PREFIXES)) {
      return NextResponse.redirect(
        new URL("/portal-helix-2026/login", request.url),
      );
    }
    return aiContentGate(pathname, response);
  }

  // Supabase Auth: getUser() で session 確認(=同時に cookie rotate)
  const supabase = createServerClient(env.supabaseUrl!, env.supabaseAnonKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 顧客画面ガード
  if (pathMatchesPrefix(pathname, CUSTOMER_PROTECTED_PREFIXES)) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      // 戻り先を保持(=ログイン後そのページに戻る)
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // suspended 確認(=user は取れているが status=suspended なら強制ログアウト)
    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", user.id)
      .single();
    if (profile?.status === "suspended") {
      // sign out + redirect
      await supabase.auth.signOut({ scope: "local" });
      const url = new URL("/login", request.url);
      url.searchParams.set("error", "suspended");
      return NextResponse.redirect(url);
    }
  }

  // 管理者画面ガード(=詳細な role 判定は admin/layout.tsx の Server Component で
  // 二段防御。middleware では未認証だけ確実に弾く)
  if (pathMatchesPrefix(pathname, ADMIN_PROTECTED_PREFIXES)) {
    if (!user) {
      return NextResponse.redirect(
        new URL("/portal-helix-2026/login", request.url),
      );
    }
  }

  return aiContentGate(pathname, response);
}

/** /ai-content と /api/ai-content をフラグ式で 404 化 */
function aiContentGate(pathname: string, response: NextResponse): NextResponse {
  if (
    !AI_CONTENT_ENABLED &&
    (pathname === "/ai-content" ||
      pathname.startsWith("/ai-content/") ||
      pathname === "/api/ai-content" ||
      pathname.startsWith("/api/ai-content/"))
  ) {
    return new NextResponse(null, { status: 404 });
  }
  return response;
}

export const config = {
  // _next/data も除外(=RSC payload リクエスト用)
  matcher: [
    "/((?!_next/static|_next/image|_next/data|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
