"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function SignupDisabledPage() {
  const { t } = useI18n();
  return (
    <div className="auth-bg min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-8 h-8 text-emerald-600 dark:text-emerald-400"
              >
                <path
                  d="M12 2L2 22h20L12 2zm0 4l7 14H5l7-14z"
                  fill="currentColor"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            {t("signup.title")}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            {t("signup.intro.line1")}
            <br />
            {t("signup.intro.line2")}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {t("signup.contact")}
          </p>
          <Link
            href="/login"
            className="inline-block w-full px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium"
          >
            {t("signup.backToLogin")}
          </Link>
          <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            {t("signup.haveAccount")}{" "}
            <Link
              href="/login"
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              {t("login.submit")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
