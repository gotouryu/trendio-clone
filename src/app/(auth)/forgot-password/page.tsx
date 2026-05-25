"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

/**
 * Password reset request page.
 * Calls the server API so reset requests can be rate limited before Supabase.
 * Always shows the same success message regardless of whether the email
 * exists in the database (prevents email enumeration attacks).
 */
export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email) return;
    setSubmitting(true);

    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      // Network failures: still show generic "sent" to prevent enumeration
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-bg min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            {t("forgot.title")}
          </h1>
          <p className="text-center text-gray-500 text-sm mb-6">
            {t("forgot.subtitle")}
          </p>

          {sent ? (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg text-sm text-gray-700">
              {t("forgot.success", { email })}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="forgot-email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t("login.email")}
                </label>
                <input
                  id="forgot-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("login.emailPlaceholder")}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-medium py-3 rounded-lg"
              >
                {submitting ? t("forgot.submitting") : t("forgot.submit")}
              </button>
            </form>
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
