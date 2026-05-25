"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser, isSupabaseReady } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";

/**
 * Phase 4 修正(C4):forgot-password メールリンクの戻り先ページを新設。
 *
 * Supabase の resetPasswordForEmail() が送るメール内のリンクは:
 *   {appUrl}/reset-password#access_token=...&type=recovery
 * (=URL hash に access_token がある状態でこのページに着地)
 *
 * Supabase JS SDK が onAuthStateChange("PASSWORD_RECOVERY") を発火するので、
 * その状態で updateUser({ password }) を呼ぶと新パスワードに更新される。
 */
export default function ResetPasswordPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [readyForUpdate, setReadyForUpdate] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isSupabaseReady()) {
      setError(t("reset.err.notConfigured"));
      return;
    }
    const sb = createSupabaseBrowser();
    // Supabase が hash の access_token を読み取って session に保存し、
    // PASSWORD_RECOVERY イベントを発火する
    const { data: sub } = sb.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReadyForUpdate(true);
    });
    // 既に session 確立済みの場合(=hash 処理直後)もチェック
    sb.auth.getUser().then(({ data }) => {
      if (data.user) setReadyForUpdate(true);
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError(t("reset.err.tooShort"));
      return;
    }
    if (password !== confirm) {
      setError(t("reset.err.mismatch"));
      return;
    }
    if (!isSupabaseReady()) {
      setError(t("reset.err.notConfigured"));
      return;
    }
    setSubmitting(true);
    try {
      const sb = createSupabaseBrowser();
      const { error: err } = await sb.auth.updateUser({ password });
      if (err) {
        setError(err.message || t("reset.err.failed"));
        return;
      }
      await sb.auth.signOut({ scope: "local" });
      setDone(true);
      // 5秒後にログインへ
      setTimeout(() => router.push("/login"), 5000);
    } catch {
      setError(t("reset.err.failed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-bg min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            {t("reset.title")}
          </h1>
          <p className="text-center text-gray-500 text-sm mb-6">
            {t("reset.subtitle")}
          </p>

          {done ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg text-sm text-gray-700">
                {t("reset.success")}
              </div>
              <Link
                href="/login"
                className="block text-center px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium"
              >
                {t("reset.toLogin")}
              </Link>
            </div>
          ) : (
            <>
              {!readyForUpdate && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-800 mb-4">
                  {t("reset.err.invalidLink")}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="reset-password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t("reset.password")}
                  </label>
                  <input
                    id="reset-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="reset-confirm"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t("reset.confirm")}
                  </label>
                  <input
                    id="reset-confirm"
                    name="confirm"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                {error && (
                  <div
                    className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700"
                    role="alert"
                  >
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={submitting || !readyForUpdate}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-medium py-3 rounded-lg"
                >
                  {submitting ? t("reset.submitting") : t("reset.submit")}
                </button>
              </form>
            </>
          )}

          <p className="text-center text-sm text-gray-600 mt-6">
            <Link
              href="/login"
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              {t("forgot.backToLogin")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
