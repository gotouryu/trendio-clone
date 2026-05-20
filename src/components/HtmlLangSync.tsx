"use client";

import { useEffect } from "react";
import { useI18n } from "@/lib/i18n";

/**
 * Phase 3 Wave-F 修正(=Agent D L1):
 * <html lang> を locale に連動させてスクリーンリーダーの読み上げ言語を正しく切り替える。
 * (=旧:`<html lang="ja">` 固定で英語UI表示中も日本語として読み上げられていた)
 */
export default function HtmlLangSync() {
  const { locale } = useI18n();
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);
  return null;
}
