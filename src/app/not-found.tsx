"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen flex items-center justify-center auth-bg px-4">
      <div className="bg-white border border-gray-100 rounded-2xl p-10 max-w-md w-full text-center">
        <div className="text-6xl font-bold text-emerald-500 mb-2">404</div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          {t("notFound.title")}
        </h1>
        <p className="text-sm text-gray-500 mb-6">{t("notFound.desc")}</p>
        <Link
          href="/dashboard"
          className="inline-block px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium"
        >
          {t("notFound.backToDashboard")}
        </Link>
      </div>
    </div>
  );
}
