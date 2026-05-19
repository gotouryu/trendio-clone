"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/authClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");

  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください");
      return;
    }
    if (!agreed) {
      setError("利用規約とプライバシーポリシーに同意してください");
      return;
    }
    setSubmitting(true);
    try {
      const session = await login(email, password);
      router.push(session.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ログインに失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-bg min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-8 h-8 text-emerald-600"
              >
                <path
                  d="M12 2L2 22h20L12 2zm0 4l7 14H5l7-14z"
                  fill="currentColor"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100">
            CustomerCare AI
          </h1>
          <p className="text-center text-gray-500 mt-2 mb-6">
            アカウントにログインしてください
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワードを入力"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                ログイン状態を維持
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                パスワードをお忘れですか?
              </Link>
            </div>

            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>
                <Link
                  href="/terms"
                  className="text-emerald-600 hover:text-emerald-700"
                >
                  利用規約
                </Link>
                {" と "}
                <Link
                  href="/privacy"
                  className="text-emerald-600 hover:text-emerald-700"
                >
                  プライバシーポリシー
                </Link>
                {" に同意します"}
              </span>
            </label>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors"
            >
              {submitting ? "ログイン中..." : "ログイン"}
            </button>

            <p className="text-center text-sm text-gray-600">
              アカウントは管理者から発行されます
            </p>
          </form>
        </div>

        <div className="flex justify-center gap-6 mt-6 text-sm text-gray-500">
          <Link href="/privacy" className="hover:text-gray-700">
            プライバシーポリシー
          </Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-gray-700">
            利用規約
          </Link>
          <span>•</span>
          <Link href="/support" className="hover:text-gray-700">
            サポート
          </Link>
        </div>
      </div>
    </div>
  );
}
