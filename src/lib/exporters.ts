import type {
  DashboardKPI,
  ActionTrendPoint,
  FollowerTrendPoint,
} from "./types";

const BOM = "﻿";

export function downloadFile(
  filename: string,
  content: string | Blob,
  mime: string,
) {
  const blob =
    content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function dateStamp(): string {
  const d = new Date();
  const p = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}

export function buildDashboardCSV(
  kpi: DashboardKPI,
  actionTrend: ActionTrendPoint[],
  followerTrend: FollowerTrendPoint[],
): string {
  const lines: string[] = [];
  lines.push("# Trendio Clone — ダッシュボード輸出");
  lines.push(`# 生成日時: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("## KPI");
  lines.push("項目,値");
  lines.push(`Followers,${kpi.followers}`);
  lines.push(`Profile Views,${kpi.profileViews}`);
  lines.push(`Total Impressions,${kpi.totalImpressions}`);
  lines.push(`Total Reach,${kpi.totalReach}`);
  lines.push("");
  lines.push("## Follower Trend");
  lines.push("日付,フォロワー数");
  followerTrend.forEach((p) => lines.push(`${p.date},${p.followers}`));
  lines.push("");
  lines.push("## Action Trend(過去8週)");
  lines.push("日付,いいね,コメント,セーブ,サイトクリック");
  actionTrend.forEach((p) =>
    lines.push(`${p.date},${p.likes},${p.comments},${p.saves},${p.clicks}`),
  );
  return BOM + lines.join("\r\n");
}

export function buildDashboardJSON(
  kpi: DashboardKPI,
  actionTrend: ActionTrendPoint[],
  followerTrend: FollowerTrendPoint[],
): string {
  return JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      kpi,
      followerTrend,
      actionTrend,
    },
    null,
    2,
  );
}
