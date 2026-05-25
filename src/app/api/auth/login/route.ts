import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { assertSameOrigin } from "@/lib/csrf";

export const runtime = "nodejs";

const LOGIN_ERROR = "メールアドレスまたはパスワードが正しくありません";

function displayName(email: string, companyName: string): string {
  if (companyName) return companyName;
  return email.split("@")[0]?.slice(0, 20) || "お客様";
}

function clientIp(req: NextRequest): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null
  );
}

async function constantDelay(startedAt: number) {
  const elapsed = Date.now() - startedAt;
  const waitMs = Math.max(0, 700 - elapsed);
  if (waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;

  let body: { email?: unknown; password?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    await constantDelay(startedAt);
    return NextResponse.json({ error: LOGIN_ERROR }, { status: 401 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password || email.length > 254 || password.length > 256) {
    await constantDelay(startedAt);
    return NextResponse.json({ error: LOGIN_ERROR }, { status: 401 });
  }

  const sb = await createSupabaseServer();
  if (!sb) {
    return NextResponse.json(
      { error: "認証サーバーに接続できません(=Supabase未設定)" },
      { status: 500 },
    );
  }

  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    console.warn("[auth login] failed", {
      emailHash: await hashEmail(email),
      ip: clientIp(req),
    });
    await constantDelay(startedAt);
    return NextResponse.json({ error: LOGIN_ERROR }, { status: 401 });
  }

  const { data: profile, error: profileErr } = await sb
    .from("profiles")
    .select("company_name, role, status")
    .eq("id", data.user.id)
    .single();

  if (profileErr || !profile) {
    await sb.auth.signOut({ scope: "local" });
    return NextResponse.json(
      { error: "プロフィール情報を取得できませんでした。管理者にお問い合わせください" },
      { status: 403 },
    );
  }

  if (profile.status === "suspended") {
    await sb.auth.signOut({ scope: "local" });
    return NextResponse.json(
      { error: "このアカウントは停止されています。管理者にお問い合わせください" },
      { status: 403 },
    );
  }

  try {
    await sb.from("login_events").insert({
      user_id: data.user.id,
      user_agent: req.headers.get("user-agent"),
    });
  } catch {
    // ログ失敗でログイン自体は止めない。
  }

  const companyName = profile.company_name ?? "";
  return NextResponse.json({
    session: {
      email: data.user.email!,
      companyName,
      displayName: displayName(data.user.email!, companyName),
      role: (profile.role as "customer" | "admin") ?? "customer",
      loggedInAt: new Date().toISOString(),
    },
  });
}

async function hashEmail(email: string): Promise<string> {
  const bytes = new TextEncoder().encode(email);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}
