import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * /admin 配下のサーバーサイドガード。
 * クライアント isAdmin() は localStorage 改竄で迂回可能なため、
 * Server Component の layout で Supabase Auth + profiles.role を確認し、
 * 非管理者はログインへリダイレクトする(=UI 露出も完全防止)。
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const sb = await createSupabaseServer();
  if (!sb) {
    // Supabase 未設定なら本番ガード不能 → 入口ログインへ
    redirect("/portal-helix-2026/login");
  }

  const { data, error } = await sb.auth.getUser();
  if (error || !data.user) {
    redirect("/portal-helix-2026/login");
  }

  const { data: profile } = await sb
    .from("profiles")
    .select("role, status")
    .eq("id", data.user.id)
    .single();

  if (profile?.status === "suspended" || profile?.role !== "admin") {
    redirect("/portal-helix-2026/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {children}
    </div>
  );
}
