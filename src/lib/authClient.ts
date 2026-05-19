"use client";

import { createSupabaseBrowser, isSupabaseReady } from "./supabase/client";

const SESSION_KEY = "trendio-clone-session";

export type Session = {
  email: string;
  companyName: string;
  loggedInAt: string;
};

// Demo credentials — accepted when Supabase is not configured (=public demo).
// Once Supabase is wired up, real accounts created via signup are used instead.
const DEMO_ACCOUNTS: { email: string; password: string; company: string }[] = [
  { email: "demo@trendio.example", password: "Demo2026!", company: "サンプル" },
];

export async function login(email: string, password: string): Promise<Session> {
  if (isSupabaseReady()) {
    const sb = createSupabaseBrowser();
    const { data, error } = await sb.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);
    const meta = (data.user?.user_metadata ?? {}) as { company_name?: string };
    const session: Session = {
      email: data.user!.email!,
      companyName: meta.company_name ?? "サンプル",
      loggedInAt: new Date().toISOString(),
    };
    persist(session);
    return session;
  }
  // Demo mode: only accept whitelisted credentials
  const matched = DEMO_ACCOUNTS.find(
    (a) => a.email === email && a.password === password,
  );
  if (!matched) {
    throw new Error(
      "メールアドレスまたはパスワードが正しくありません(=デモ用ID/PWを入力してください)",
    );
  }
  const session: Session = {
    email: matched.email,
    companyName: matched.company,
    loggedInAt: new Date().toISOString(),
  };
  persist(session);
  return session;
}

export async function signup(
  email: string,
  password: string,
  companyName: string,
): Promise<Session> {
  if (isSupabaseReady()) {
    const sb = createSupabaseBrowser();
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: { data: { company_name: companyName } },
    });
    if (error) throw new Error(error.message);
    const session: Session = {
      email: data.user?.email ?? email,
      companyName,
      loggedInAt: new Date().toISOString(),
    };
    persist(session);
    return session;
  }
  const session: Session = {
    email,
    companyName: companyName || "サンプル",
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

function persist(s: Session) {
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  }
}
