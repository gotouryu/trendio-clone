/**
 * Karteia の顧客対応・販売支援プロセスバー(=5ステップ、現在地ハイライト)
 * 補助金審査用ラベル「共P-01」はお客様画面から削除済み。
 * 現在地は ProcessBarStep の名前で指定:
 *   - "understand"   → 顧客理解(dashboard)
 *   - "unattended"   → 無人受付(comments)
 *   - "records"      → 顧客カルテ(customers)
 *   - "sales"        → 販売支援(=申請外、表示のみ)
 *   - "loop"         → 改善ループ(=概念、表示のみ)
 */
"use client";

import React from "react";
import { useI18n } from "@/lib/i18n";

export type ProcessBarStep =
  | "understand"
  | "unattended"
  | "records"
  | "sales"
  | "loop";

const STEPS: { key: ProcessBarStep; num: number; labelKey: string }[] = [
  { key: "understand", num: 1, labelKey: "process.understand" },
  { key: "unattended", num: 2, labelKey: "process.unattended" },
  { key: "records", num: 3, labelKey: "process.records" },
  { key: "sales", num: 4, labelKey: "process.sales" },
  { key: "loop", num: 5, labelKey: "process.loop" },
];

export default function KarteiaProcessBar({ current }: { current: ProcessBarStep }) {
  const { t } = useI18n();
  return (
    <div
      className="mb-5 bg-white rounded-2xl border-2 p-3 shadow-sm"
      style={{ borderColor: "var(--card-border)" }}
    >
      <div
        className="text-[11px] font-medium mb-2 uppercase tracking-wider"
        style={{ color: "var(--muted)" }}
      >
        {t("process.title")}
      </div>
      <div className="flex items-center gap-1 flex-wrap sm:flex-nowrap">
        {STEPS.map((step, idx) => {
          const isActive = step.key === current;
          return (
            <React.Fragment key={step.key}>
              <div
                className="flex-1 min-w-[100px] flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium"
                style={
                  isActive
                    ? {
                        background:
                          "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                        color: "white",
                        boxShadow: "0 1px 2px rgba(13, 148, 136, 0.3)",
                      }
                    : {
                        background: "#f1f6f5",
                        color: "var(--muted)",
                        border: "2px solid var(--card-border)",
                      }
                }
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={
                    isActive
                      ? { background: "white", color: "#0f766e" }
                      : { background: "var(--muted-light)", color: "white" }
                  }
                >
                  {step.num}
                </span>
                <span>{t(step.labelKey)}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <span
                  className="hidden sm:inline px-0.5"
                  style={{ color: "var(--muted-light)" }}
                >
                  →
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Karteiaのウェルカムヘッダー(=「お疲れさまです、龍さん」スタイル)
 * 各画面の上部で再利用。companyName は省略可。
 */
export function KarteiaWelcomeHeader({
  companyName,
  greeting,
  title,
  subtitle,
  rightSlot,
}: {
  companyName?: string;
  greeting: string;
  title: string;
  subtitle: string;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-6 mb-5 shadow-md text-white"
      style={{
        background: "linear-gradient(135deg, #0d9488 0%, #134e4a 100%)",
      }}
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-sm mb-1" style={{ color: "#a7d8d1" }}>
            {greeting}
            {companyName && (
              <span className="ml-1">/ {companyName}</span>
            )}
          </div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm mt-2" style={{ color: "#a7d8d1" }}>
            {subtitle}
          </p>
        </div>
        {rightSlot}
      </div>
    </div>
  );
}
