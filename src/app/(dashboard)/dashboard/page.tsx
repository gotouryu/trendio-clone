"use client";

import { useState } from "react";
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
} from "lucide-react";
import FollowerTrendChart from "@/components/charts/FollowerTrendChart";
import ActionTrendChart from "@/components/charts/ActionTrendChart";
import GenderByPeriodChart from "@/components/charts/GenderByPeriodChart";
import GenderDoughnutChart from "@/components/charts/GenderDoughnutChart";
import FollowerRegionChart from "@/components/charts/FollowerRegionChart";
import PostTimeChart from "@/components/charts/PostTimeChart";
import {
  mockKPI,
  mockFollowerTrend,
  mockActionTrend,
  mockGenderRatio,
  mockGenderByPeriod,
  mockRegions,
  mockHourlyEngagement,
} from "@/lib/mockData";

const periodOptions = [
  { value: "7", label: "過去7日間" },
  { value: "30", label: "過去30日間" },
  { value: "90", label: "過去90日間" },
];

export default function DashboardPage() {
  const [period, setPeriod] = useState("30");
  const totalLikes = mockActionTrend.reduce((s, p) => s + p.likes, 0);
  const totalComments = mockActionTrend.reduce((s, p) => s + p.comments, 0);
  const totalSaves = mockActionTrend.reduce((s, p) => s + p.saves, 0);
  const totalClicks = mockActionTrend.reduce((s, p) => s + p.clicks, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">分析</h1>
          <p className="text-sm text-gray-500 mt-1">
            最終更新日時:本日午前9時
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-9 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {periodOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            <Download className="w-4 h-4" />
            輸出
          </button>
        </div>
      </div>

      {/* Instagram Section */}
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="ig-icon-bg w-10 h-10 rounded-xl flex items-center justify-center">
            <Instagram className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">インスタグラム</h2>
            <p className="text-xs text-gray-500">
              フォロワー、エンゲージメント、オーディエンス
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard
            icon={<Users className="w-5 h-5 text-orange-500" />}
            label="FOLLOWERS"
            value={mockKPI.followers}
          />
          <KPICard
            icon={<Eye className="w-5 h-5 text-orange-500" />}
            label="PROFILE VIEWS"
            value={mockKPI.profileViews}
          />
          <KPICard
            icon={<BarChart3 className="w-5 h-5 text-orange-500" />}
            label="TOTAL IMPRESSIONS"
            value={mockKPI.totalImpressions}
          />
          <KPICard
            icon={<Radio className="w-5 h-5 text-orange-500" />}
            label="TOTAL REACH"
            value={mockKPI.totalReach}
          />
        </div>

        {/* Follower Trend */}
        <Card className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Follower Trend</h3>
              <p className="text-xs text-gray-500">Last 12 weeks</p>
            </div>
            <div className="text-xs text-emerald-600 font-medium">+0 (0%)</div>
          </div>
          <div className="h-64">
            <FollowerTrendChart data={mockFollowerTrend} />
          </div>
        </Card>

        {/* Action Trend */}
        <Card className="mb-6">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900">行動傾向</h3>
            <p className="text-xs text-gray-500">過去8週間の要約</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <ActionPill icon={<Heart className="w-4 h-4 text-orange-500" />} label="いいね!" value={totalLikes} />
            <ActionPill icon={<MessageCircle className="w-4 h-4 text-orange-500" />} label="コメント" value={totalComments} />
            <ActionPill icon={<Bookmark className="w-4 h-4 text-orange-500" />} label="セーブ" value={totalSaves} />
            <ActionPill icon={<Link2 className="w-4 h-4 text-orange-500" />} label="サイトクリック数" value={totalClicks} />
          </div>
          <div className="h-64">
            <ActionTrendChart data={mockActionTrend} />
          </div>
        </Card>

        {/* Gender & Doughnut */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <Card>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">
                  フォロワーの性別(期間別)
                </h3>
                <p className="text-xs text-gray-500">月ごとの男女比の推移</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-orange-600"></span>男
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-orange-400"></span>女性
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-orange-200"></span>他の
                </span>
              </div>
            </div>
            <div className="h-64">
              <GenderByPeriodChart data={mockGenderByPeriod} />
            </div>
          </Card>
          <Card>
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900">
                フォロワーの男女比
              </h3>
              <p className="text-xs text-gray-500">現在の組成比</p>
            </div>
            <div className="h-48">
              <GenderDoughnutChart data={mockGenderRatio} />
            </div>
            <div className="flex justify-center gap-4 mt-4 text-xs text-gray-700">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                女性 <strong>{mockGenderRatio.female}.0%</strong>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                男 <strong>{mockGenderRatio.male}.0%</strong>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-200"></span>
                他の <strong>{mockGenderRatio.other}.0%</strong>
              </span>
            </div>
          </Card>
        </div>

        {/* Region & PostTime */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <Card>
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900">フォロワー領域</h3>
              <p className="text-xs text-gray-500">上位10地域の分布</p>
            </div>
            <FollowerRegionChart data={mockRegions} />
          </Card>
          <Card>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">掲載時間</h3>
                <p className="text-xs text-gray-500">時間単位での集約</p>
              </div>
              <div className="text-xs text-gray-500">⌚ 最適時刻:17:00</div>
            </div>
            <div className="h-40">
              <PostTimeChart data={mockHourlyEngagement} />
            </div>
            <div className="mt-3 p-3 bg-emerald-50 rounded-lg flex items-start gap-2 text-xs">
              <Lightbulb className="w-4 h-4 text-emerald-600 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">推奨投稿時間</div>
                <div className="text-gray-600 mt-0.5">
                  17:00 · 08:00 · 03:00 のエンゲージメントが最も高い
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* TikTok Section */}
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="tt-icon-bg w-10 h-10 rounded-xl flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">TikTok</h2>
            <p className="text-xs text-gray-500">
              フォロワー数と動画パフォーマンス
            </p>
          </div>
        </div>
        <Card className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="#111" className="w-8 h-8">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">
            TikTokアカウントを接続してください
          </h3>
          <p className="text-sm text-gray-500 mb-5">
            アカウントを接続すると、動画のパフォーマンス、エンゲージメント分析、その他のインサイトを確認できます。
          </p>
          <a
            href="/settings"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
          >
            <Link2 className="w-4 h-4" />
            設定ページで接続する
          </a>
        </Card>
      </section>

      {/* Insight Whitepaper */}
      <section className="mb-8">
        <Card>
          <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <FileBarChart className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  インサイトホワイトペーパー
                </h3>
                <p className="text-xs text-gray-500">
                  AIがデータを分析し、レポートを自動生成する
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-700">
                <Save className="w-3.5 h-3.5" />
                保存済み(0)
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-700">
                <Instagram className="w-3.5 h-3.5" />
                インスタグラム
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-500">
                TikTok
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                レポートを生成する
              </button>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-12 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-200 flex items-center justify-center">
              <FileBarChart className="w-6 h-6 text-gray-500" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">
              インサイトレポートを生成する
            </h4>
            <p className="text-sm text-gray-500">
              InstagramまたはTikTokを選択すると、AIが詳細な分析レポートを自動生成します。
            </p>
          </div>
        </Card>
      </section>
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
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center mb-3">
        {icon}
      </div>
      <div className="text-xs text-gray-500 font-medium">{label}</div>
      <div className="text-2xl font-bold text-gray-900 mt-1">
        {value.toLocaleString()}
      </div>
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
    <div className="bg-orange-50 rounded-lg p-3 flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center">
        {icon}
      </div>
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-lg font-bold text-gray-900">{value}</div>
      </div>
    </div>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white border border-gray-100 rounded-xl p-5 ${className}`}
    >
      {children}
    </div>
  );
}

function Sparkles({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1l2.5 6.5L21 10l-6.5 2.5L12 19l-2.5-6.5L3 10l6.5-2.5L12 1z" />
    </svg>
  );
}
