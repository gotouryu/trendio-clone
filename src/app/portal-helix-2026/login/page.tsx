"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { login } from "@/lib/authClient";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください");
      return;
    }
    setSubmitting(true);
    try {
      const session = await login(email, password);
      if (session.role !== "admin") {
        setError("このページは管理者専用です");
        setSubmitting(false);
        return;
      }
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ログインに失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 dark:bg-black flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 p-8">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-xl bg-red-500/20 flex items-center justify-center">
              <Lock className="w-7 h-7 text-red-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-white mb-2">
            管理者ポータル
          </h1>
          <p className="text-center text-gray-400 text-sm mb-8">
            Helix Plus Admin Console
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@helixplus.jp"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-900/30 border border-red-800 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-medium py-3 rounded-lg transition-colors"
            >
              {submitting ? "ログイン中..." : "管理者ログイン"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-6">
            このページは管理者専用です。一般のお客様は{" "}
            <a href="/login" className="text-emerald-400 hover:text-emerald-300">
              通常ログイン
            </a>{" "}
            をご利用ください。
          </p>
        </div>
      </div>
    </div>
  );
}
