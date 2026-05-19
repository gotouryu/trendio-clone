"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Phase 1B: Supabase 接続後は sb.auth.resetPasswordForEmail(email) を呼ぶ
    setSent(true);
  }

  return (
    <div className="auth-bg min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            パスワードをお忘れですか?
          </h1>
          <p className="text-center text-gray-500 text-sm mb-6">
            登録メールアドレスにリセット用リンクを送信します
          </p>

          {sent ? (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg text-sm text-gray-700">
              {email} にメールを送信しました(=Supabase Auth 接続後に有効)。受信ボックスをご確認ください。
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-lg"
              >
                リセットリンクを送る
              </button>
            </form>
          )}

          <p className="text-center text-sm text-gray-600 mt-6">
            <Link
              href="/login"
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              ログインに戻る
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
