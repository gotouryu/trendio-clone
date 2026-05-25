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
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    session?: Session;
  };
  if (!res.ok || !data.session) {
    throw new Error(data.error ?? "メールアドレスまたはパスワードが正しくありません");
  }
  const session = data.session;
  session.displayName = deriveDisplayName(session.email, session.companyName);
  persist(session);
  return session;
}

/**
 * ロール不一致でログイン画面に弾く時のクリーンアップ。
 * Supabase Auth セッション(=cookie + localStorage)+ アプリ独自セッションを両方とも削除。
 * scope='local' で他デバイスのセッションは生かす。
 */
export async function abortLogin(): Promise<void> {
  try {
    if (isSupabaseReady()) {
      const sb = createSupabaseBrowser();
      await sb.auth.signOut({ scope: "local" });
    }
  } finally {
    await clearClientSessionStorage();
  }
}

export async function logout(): Promise<void> {
  try {
    if (isSupabaseReady()) {
      const sb = createSupabaseBrowser();
      // scope='local' で当ブラウザのセッションのみ削除(=他デバイスは巻き込まない)
      await sb.auth.signOut({ scope: "local" });
    }
  } finally {
    await clearClientSessionStorage();
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

async function clearClientSessionStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
}
