"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart } from "lucide-react";
import { login } from "@/lib/authClient";
import { useI18n } from "@/lib/i18n";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
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
      setError(t("login.err.required"));
      return;
    }
    if (!agreed) {
      setError(t("login.err.agree"));
      return;
    }
    setSubmitting(true);
    try {
      const session = await login(email, password);
      router.push(session.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("login.err.failed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-bg min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div
          className="bg-white rounded-2xl shadow-lg border-2 p-8"
          style={{ borderColor: "var(--card-border)" }}
        >
          <div className="flex justify-center mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md"
              style={{
                background:
                  "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
              }}
            >
              <Heart
                className="w-8 h-8 text-white"
                fill="currentColor"
              />
            </div>
          </div>
          <h1
            className="text-3xl font-bold text-center"
            style={{ color: "var(--foreground)" }}
          >
            Karteia
          </h1>
          <p
            className="text-center text-sm mt-2 mb-6"
            style={{ color: "var(--muted)" }}
          >
            {t("login.greeting")}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--foreground)" }}
              >
                {t("login.email")}
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 placeholder-gray-400"
                style={
                  {
                    borderColor: "var(--card-border)",
                    color: "var(--foreground)",
                    background: "white",
                    "--tw-ring-color": "var(--brand)",
                  } as React.CSSProperties
                }
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--foreground)" }}
              >
                {t("login.password")}
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("login.passwordPlaceholder")}
                className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 placeholder-gray-400"
                style={
                  {
                    borderColor: "var(--card-border)",
                    color: "var(--foreground)",
                    background: "white",
                  } as React.CSSProperties
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <label
                className="flex items-center gap-2 text-sm"
                style={{ color: "var(--muted)" }}
              >
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300"
                  style={{ accentColor: "var(--brand)" }}
                />
                {t("login.rememberMe")}
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium"
                style={{ color: "var(--brand-dark)" }}
              >
                {t("login.forgot")}
              </Link>
            </div>

            <label
              className="flex items-start gap-2 text-sm"
              style={{ color: "var(--muted)" }}
            >
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 rounded border-gray-300"
                style={{ accentColor: "var(--brand)" }}
              />
              <span>
                <Link
                  href="/terms"
                  className="font-medium"
                  style={{ color: "var(--brand-dark)" }}
                >
                  {t("login.terms")}
                </Link>
                {t("login.agreeMid")}
                <Link
                  href="/privacy"
                  className="font-medium"
                  style={{ color: "var(--brand-dark)" }}
                >
                  {t("login.privacy")}
                </Link>
                {t("login.agreeEnd")}
              </span>
            </label>

            {error && (
              <div
                className="text-sm p-3 rounded-lg"
                style={{
                  color: "#b91c1c",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              style={{
                background:
                  "linear-gradient(135deg, #0d9488 0%, #134e4a 100%)",
              }}
            >
              {submitting ? t("login.submitting") : t("login.submit")}
            </button>

            <p
              className="text-center text-sm"
              style={{ color: "var(--muted)" }}
            >
              {t("login.adminIssued")}
            </p>
          </form>
        </div>

        <div
          className="flex justify-center gap-6 mt-6 text-sm"
          style={{ color: "var(--muted)" }}
        >
          <Link href="/privacy" className="hover:underline">
            {t("footer.privacy")}
          </Link>
          <span>•</span>
          <Link href="/terms" className="hover:underline">
            {t("footer.terms")}
          </Link>
          <span>•</span>
          <Link href="/support" className="hover:underline">
            {t("footer.support")}
          </Link>
        </div>
      </div>
    </div>
  );
}
