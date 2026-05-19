"use client";

import { createSupabaseBrowser, isSupabaseReady } from "./supabase/client";

const SESSION_KEY = "trendio-clone-session";

export type Role = "customer" | "admin";

export type Session = {
  email: string;
  companyName: string;
  role: Role;
  loggedInAt: string;
};

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

  const session: Session = {
    email: user.email!,
    companyName: profile?.company_name ?? "サンプル",
    role: (profile?.role as Role) ?? "customer",
    loggedInAt: new Date().toISOString(),
  };
  persist(session);
  return session;
}

export async function logout(): Promise<void> {
  if (isSupabaseReady()) {
    const sb = createSupabaseBrowser();
    await sb.auth.signOut();
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
