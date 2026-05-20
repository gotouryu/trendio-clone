"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function SupportPage() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen auth-bg py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-100 p-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t("support.title")}
        </h1>
        <p className="text-sm text-gray-500 mb-8">{t("support.subtitle")}</p>

        <div className="space-y-6 text-sm text-gray-700">
          <div>
            <h2 className="font-semibold text-gray-900 mb-2">
              {t("support.faq.title")}
            </h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>{t("support.faq.q1")}</li>
              <li>{t("support.faq.q2")}</li>
              <li>{t("support.faq.q3")}</li>
            </ul>
          </div>

          <div>
            <h2 className="font-semibold text-gray-900 mb-2">
              {t("support.contact.title")}
            </h2>
            <p>
              {t("support.contact.desc")}{" "}
              <a
                href="mailto:r.gotou@houzyu.com"
                className="text-emerald-600 hover:text-emerald-700"
              >
                r.gotou@houzyu.com
              </a>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {t("support.contact.operator")}: HelixPlus Inc.
            </p>
          </div>
        </div>

        <Link
          href="/login"
          className="inline-block mt-8 text-sm text-emerald-600 hover:text-emerald-700"
        >
          ← {t("support.back")}
        </Link>
      </div>
    </div>
  );
}
