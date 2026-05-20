import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

/**
 * Phase 4 修正(H7):管理者ポータルを検索エンジンから除外
 * - robots: noindex / nofollow
 * - Google にインデックスされて管理者ログイン画面が公開される事故を防止
 */
export const metadata: Metadata = {
  title: "Karteia Admin Portal",
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  themeColor: "#0e3a4d",
};

export default function PortalHelixLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
