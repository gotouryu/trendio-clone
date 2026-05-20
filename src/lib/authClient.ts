"use client";

import { createSupabaseBrowser, isSupabaseReady } from "./supabase/client";

const SESSION_KEY = "karteia-session";

export type Role = "customer" | "admin";

export type Session = {
  email: string;
  /**
   * 会社名(=管理画面から発行された profiles.company_name)。
   * 未設定の場合は空文字。サイドバーの表示判定で空文字は隠す。
   */
  companyName: string;
  /** 画面ヘッダーの「お疲れさまです、〇〇さん」用の表示名。会社名→email先頭の順でフォールバック */
  displayName: string;
  role: Role;
  loggedInAt: string;
};

/** email から表示名候補を作る(=@ 前の部分、最大20文字) */
function deriveDisplayName(email: string, companyName: string): string {
  if (companyName) return companyName;
  const local = email.split("@")[0] ?? "";
  return local.slice(0, 20) || "お客様";
}

/**
 * Sign in with email/password.
 * Records a login_events row and returns the session with role.
 * Throws on invalid credentials or suspended account.
 */
export async function login(email: string, password: string): Promise<Session> {
  if (!isSupabaseReady()) {
    throw new Error("認証サーバーに接続できません(=Supabase未設定)");
  }
  const sb = createSupabaseBrowser();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error("メールアドレスまたはパスワードが正しくありません");
  const user = data.user!;

  // Fetch profile (=role, company_name, status)
  const { data: profile } = await sb
    .from("profiles")
    .select("company_name, role, status")
    .eq("id", user.id)
    .single();

  if (profile?.status === "suspended") {
    await sb.auth.signOut();
    throw new Error("このアカウントは停止されています。管理者にお問い合わせください");
  }

  // Record login event (best-effort, ignore failure)
  try {
    await sb.from("login_events").insert({
      user_id: user.id,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
  } catch {
    // ignore
  }

  const companyName = profile?.company_name ?? "";
  const session: Session = {
    email: user.email!,
    companyName,
    displayName: deriveDisplayName(user.email!, companyName),
    role: (profile?.role as Role) ?? "customer",
    loggedInAt: new Date().toISOString(),
  };
  persist(session);
  return session;
}

/**
 * ロール不一致でログイン画面に弾く時のクリーンアップ。
 * Supabase Auth セッション(=cookie + localStorage)+ アプリ独自セッションを両方とも削除。
 * scope='local' で他デバイスのセッションは生かす。
 */
export async function abortLogin(): Promise<void> {
  if (isSupabaseReady()) {
    const sb = createSupabaseBrowser();
    await sb.auth.signOut({ scope: "local" });
  }
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
  }
}

export async function logout(): Promise<void> {
  if (isSupabaseReady()) {
    const sb = createSupabaseBrowser();
    // scope='local' で当ブラウザのセッションのみ削除(=他デバイスは巻き込まない)
    await sb.auth.signOut({ scope: "local" });
  }
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function isAdmin(): boolean {
  return getSession()?.role === "admin";
}

function persist(s: Session) {
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  }
}
