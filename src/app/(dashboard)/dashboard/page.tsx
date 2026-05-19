"use client";

import { useState, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { jsPDF } from "jspdf";
import {
  Users,
  Eye,
  BarChart3,
  Radio,
  Heart,
  MessageCircle,
  Bookmark,
  Link2,
  Lightbulb,
  Instagram,
  Download,
  ChevronDown,
  Save,
  FileBarChart,
  GripVertical,
  FileDown,
} from "lucide-react";
import {
  mockKPI,
  mockFollowerTrend,
  mockActionTrend,
  mockGenderRatio,
  mockGenderByPeriod,
  mockRegions,
  mockHourlyEngagement,
} from "@/lib/mockData";
import { useToast } from "@/components/providers/ToasterProvider";
import { useLocalStorage } from "@/lib/useLocalStorage";
import {
  buildDashboardCSV,
  buildDashboardJSON,
  dateStamp,
  downloadFile,
} from "@/lib/exporters";

const FollowerTrendChart = dynamic(
  () => import("@/components/charts/FollowerTrendChart"),
  { ssr: false, loading: () => <ChartSkeleton h={256} /> },
);
const ActionTrendChart = dynamic(
  () => import("@/components/charts/ActionTrendChart"),
  { ssr: false, loading: () => <ChartSkeleton h={256} /> },
);
const GenderByPeriodChart = dynamic(
  () => import("@/components/charts/GenderByPeriodChart"),
  { ssr: false, loading: () => <ChartSkeleton h={256} /> },
);
const GenderDoughnutChart = dynamic(
  () => import("@/components/charts/GenderDoughnutChart"),
  { ssr: false, loading: () => <ChartSkeleton h={192} /> },
);
const FollowerRegionChart = dynamic(
  () => import("@/components/charts/FollowerRegionChart"),
  { ssr: false, loading: () => <ChartSkeleton h={200} /> },
);
const PostTimeChart = dynamic(
  () => import("@/components/charts/PostTimeChart"),
  { ssr: false, loading: () => <ChartSkeleton h={160} /> },
);

function ChartSkeleton({ h }: { h: number }) {
  return (
    <div
      className="w-full animate-pulse bg-gray-100 dark:bg-gray-800 rounded"
      style={{ height: h }}
    />
  );
}

const periodOptions = [
  { value: "7", label: "過去7日間" },
  { value: "30", label: "過去30日間" },
  { value: "90", label: "過去90日間" },
];

type WidgetKey =
  | "followerTrend"
  | "actionTrend"
  | "genderByPeriod"
  | "genderRatio"
  | "region"
  | "postTime";

const DEFAULT_ORDER: WidgetKey[] = [
  "followerTrend",
  "actionTrend",
  "genderByPeriod",
  "genderRatio",
  "region",
  "postTime",
];

export default function DashboardPage() {
  const { toast } = useToast();
  const [period, setPeriod] = useState("30");
  const [exportOpen, setExportOpen] = useState(false);
  const [order, setOrder] = useLocalStorage<WidgetKey[]>(
    "trendio-dashboard-order",
    DEFAULT_ORDER,
  );
  const dragKey = useRef<WidgetKey | null>(null);

  // Period filter
  const filteredFollowerTrend = useMemo(() => {
    if (period === "7") return mockFollowerTrend.slice(-7);
    return mockFollowerTrend;
  }, [period]);

  const filteredActionTrend = useMemo(() => {
    if (period === "7") return mockActionTrend.slice(-7);
    return mockActionTrend;
  }, [period]);

  const totalLikes = filteredActionTrend.reduce((s, p) => s + p.likes, 0);
  const totalComments = filteredActionTrend.reduce(
    (s, p) => s + p.comments,
    0,
  );
  const totalSaves = filteredActionTrend.reduce((s, p) => s + p.saves, 0);
  const totalClicks = filteredActionTrend.reduce((s, p) => s + p.clicks, 0);

  function exportCSV() {
    const csv = buildDashboardCSV(
      mockKPI,
      filteredActionTrend,
      filteredFollowerTrend,
    );
    downloadFile(`trendio-dashboard-${dateStamp()}.csv`, csv, "text/csv");
    toast("CSVをダウンロードしました", "success");
    setExportOpen(false);
  }

  function exportJSON() {
    const json = buildDashboardJSON(
      mockKPI,
      filteredActionTrend,
      filteredFollowerTrend,
    );
    downloadFile(
      `trendio-dashboard-${dateStamp()}.json`,
      json,
      "application/json",
    );
    toast("JSONをダウンロードしました", "success");
    setExportOpen(false);
  }

  function exportPDF() {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Trendio Insight Report", 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Generated: ${new Date().toISOString().slice(0, 10)}`, 14, 26);
    doc.text(`Period: ${periodOptions.find((o) => o.value === period)?.label}`, 14, 32);

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("KPI Summary", 14, 46);
    doc.setFontSize(11);
    let y = 54;
    const rows: [string, string | number][] = [
      ["Followers", mockKPI.followers],
      ["Profile Views", mockKPI.profileViews],
      ["Total Impressions", mockKPI.totalImpressions],
      ["Total Reach", mockKPI.totalReach],
      ["Total Likes (period)", totalLikes],
      ["Total Comments (period)", totalComments],
      ["Total Saves (period)", totalSaves],
      ["Total Site Clicks (period)", totalClicks],
    ];
    rows.forEach(([k, v]) => {
      doc.text(`${k}:`, 18, y);
      doc.text(String(v), 90, y);
      y += 7;
    });

    y += 4;
    doc.setFontSize(14);
    doc.text("Recommended Post Times", 14, y);
    y += 8;
    doc.setFontSize(11);
    doc.text("17:00 / 08:00 / 03:00 — highest engagement", 18, y);

    y += 14;
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(
      "Note: This is a demo report. Real AI-generated reports will appear here when the Claude API key is configured.",
      14,
      y,
      { maxWidth: 180 },
    );

    doc.save(`trendio-report-${dateStamp()}.pdf`);
    toast("PDFを生成しました", "success");
  }

  // Drag-and-drop reorder
  function onDragStart(e: React.DragEvent, key: WidgetKey) {
    dragKey.current = key;
    e.dataTransfer.effectAllowed = "move";
  }
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }
  function onDrop(e: React.DragEvent, target: WidgetKey) {
    e.preventDefault();
    const src = dragKey.current;
    if (!src || src === target) return;
    setOrder((prev) => {
      const next = [...prev];
      const from = next.indexOf(src);
      const to = next.indexOf(target);
      next.splice(from, 1);
      next.splice(to, 0, src);
      return next;
    });
    dragKey.current = null;
  }

  function renderWidget(key: WidgetKey) {
    const dragProps = {
      draggable: true,
      onDragStart: (e: React.DragEvent) => onDragStart(e, key),
      onDragOver,
      onDrop: (e: React.DragEvent) => onDrop(e, key),
    };

    switch (key) {
      case "followerTrend":
        return (
          <DraggableCard key={key} dragProps={dragProps} title="Follower Trend" sub={`Last ${period === "7" ? "7 days" : "12 weeks"}`} right={<span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">+0 (0%)</span>}>
            <div className="h-64">
              <FollowerTrendChart data={filteredFollowerTrend} />
            </div>
          </DraggableCard>
        );
      case "actionTrend":
        return (
          <DraggableCard key={key} dragProps={dragProps} title="行動傾向" sub="過去8週間の要約">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <ActionPill icon={<Heart className="w-4 h-4 text-orange-500" />} label="いいね!" value={totalLikes} />
              <ActionPill icon={<MessageCircle className="w-4 h-4 text-orange-500" />} label="コメント" value={totalComments} />
              <ActionPill icon={<Bookmark className="w-4 h-4 text-orange-500" />} label="セーブ" value={totalSaves} />
              <ActionPill icon={<Link2 className="w-4 h-4 text-orange-500" />} label="サイトクリック数" value={totalClicks} />
            </div>
            <div className="h-64">
              <ActionTrendChart data={filteredActionTrend} />
            </div>
          </DraggableCard>
        );
      case "genderByPeriod":
        return (
          <DraggableCard key={key} dragProps={dragProps} title="フォロワーの性別(期間別)" sub="月ごとの男女比の推移" right={<div className="flex items-center gap-3 text-xs"><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-600"/>男</span><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400"/>女性</span><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-200"/>他の</span></div>}>
            <div className="h-64">
              <GenderByPeriodChart data={mockGenderByPeriod} />
            </div>
          </DraggableCard>
        );
      case "genderRatio":
        return (
          <DraggableCard key={key} dragProps={dragProps} title="フォロワーの男女比" sub="現在の組成比">
            <div className="h-48">
              <GenderDoughnutChart data={mockGenderRatio} />
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs text-gray-700 dark:text-gray-300">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400"/>女性 <strong>{mockGenderRatio.female}.0%</strong></span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-600"/>男 <strong>{mockGenderRatio.male}.0%</strong></span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-200"/>他の <strong>{mockGenderRatio.other}.0%</strong></span>
            </div>
          </DraggableCard>
        );
      case "region":
        return (
          <DraggableCard key={key} dragProps={dragProps} title="フォロワー領域" sub="上位10地域の分布">
            <FollowerRegionChart data={mockRegions} />
          </DraggableCard>
        );
      case "postTime":
        return (
          <DraggableCard key={key} dragProps={dragProps} title="掲載時間" sub="時間単位での集約" right={<div className="text-xs text-gray-500 dark:text-gray-400">⌚ 最適時刻:17:00</div>}>
            <div className="h-40">
              <PostTimeChart data={mockHourlyEngagement} />
            </div>
            <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex items-start gap-2 text-xs">
              <Lightbulb className="w-4 h-4 text-emerald-600 mt-0.5"/>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">推奨投稿時間</div>
                <div className="text-gray-600 dark:text-gray-300 mt-0.5">17:00 · 08:00 · 03:00 のエンゲージメントが最も高い</div>
              </div>
            </div>
          </DraggableCard>
        );
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">分析</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            最終更新日時:本日午前9時
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 pr-9 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="期間を選択"
            >
              {periodOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <button
              onClick={() => setExportOpen((o) => !o)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              aria-haspopup="menu"
              aria-expanded={exportOpen}
            >
              <Download className="w-4 h-4"/>
              輸出
              <ChevronDown className="w-3 h-3" />
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 py-1" role="menu">
                <button onClick={exportCSV} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700" role="menuitem">
                  CSV(Excel互換)
                </button>
                <button onClick={exportJSON} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700" role="menuitem">
                  JSON
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instagram Section */}
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="ig-icon-bg w-10 h-10 rounded-xl flex items-center justify-center">
            <Instagram className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">インスタグラム</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">フォロワー、エンゲージメント、オーディエンス</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard icon={<Users className="w-5 h-5 text-orange-500"/>} label="FOLLOWERS" value={mockKPI.followers} />
          <KPICard icon={<Eye className="w-5 h-5 text-orange-500"/>} label="PROFILE VIEWS" value={mockKPI.profileViews} />
          <KPICard icon={<BarChart3 className="w-5 h-5 text-orange-500"/>} label="TOTAL IMPRESSIONS" value={mockKPI.totalImpressions} />
          <KPICard icon={<Radio className="w-5 h-5 text-orange-500"/>} label="TOTAL REACH" value={mockKPI.totalReach} />
        </div>

        {/* Draggable widgets */}
        <div className="space-y-6">
          {order.map((key) => renderWidget(key))}
        </div>
      </section>

      {/* TikTok Section */}
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="tt-icon-bg w-10 h-10 rounded-xl flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">TikTok</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">フォロワー数と動画パフォーマンス</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-8 sm:p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-gray-900 dark:text-gray-100" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z"/>
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">TikTokアカウントを接続してください</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">アカウントを接続すると、動画のパフォーマンス、エンゲージメント分析、その他のインサイトを確認できます。</p>
          <a href="/settings" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-600">
            <Link2 className="w-4 h-4"/>
            設定ページで接続する
          </a>
        </div>
      </section>

      {/* Whitepaper */}
      <section className="mb-8">
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5">
          <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <FileBarChart className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">インサイトホワイトペーパー</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">AIがデータを分析し、レポートを自動生成する</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-700 dark:text-gray-200">
                <Save className="w-3.5 h-3.5"/>保存済み(0)
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg text-xs text-orange-700 dark:text-orange-300">
                <Instagram className="w-3.5 h-3.5"/>インスタグラム
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-500 dark:text-gray-400">
                TikTok
              </button>
              <button onClick={exportPDF} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium">
                <FileDown className="w-3.5 h-3.5"/>PDFで保存
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white rounded-lg text-xs font-medium">
                <SparkleIcon className="w-3.5 h-3.5"/>レポートを生成する
              </button>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-12 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <FileBarChart className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">インサイトレポートを生成する</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">InstagramまたはTikTokを選択すると、AIが詳細な分析レポートを自動生成します。</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function DraggableCard({
  dragProps,
  title,
  sub,
  right,
  children,
}: {
  dragProps: React.HTMLAttributes<HTMLDivElement> & { draggable?: boolean };
  title: string;
  sub?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      {...dragProps}
      className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5 hover:shadow-sm transition-shadow"
    >
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="flex items-start gap-2">
          <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600 mt-1 cursor-grab" aria-hidden />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            {sub && <p className="text-xs text-gray-500 dark:text-gray-400">{sub}</p>}
          </div>
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function KPICard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5">
      <div className="w-9 h-9 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center mb-3">
        {icon}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value.toLocaleString()}</div>
    </div>
  );
}

function ActionPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-md bg-white dark:bg-gray-800 flex items-center justify-center">{icon}</div>
      <div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{value}</div>
      </div>
    </div>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1l2.5 6.5L21 10l-6.5 2.5L12 19l-2.5-6.5L3 10l6.5-2.5L12 1z" />
    </svg>
  );
}
