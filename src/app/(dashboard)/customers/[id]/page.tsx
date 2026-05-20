"use client";

import { useEffect, useState, useCallback, use } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  MessageCircle,
  Sparkles,
  Heart,
  Bookmark,
  User as UserIcon,
  Tag as TagIcon,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type {
  Customer,
  CustomerInteraction,
  CustomerAIAnalysis,
  InquiryCategory,
} from "@/lib/types";
import { mockCustomers, mockInteractions } from "@/lib/mockData";
import { useToast } from "@/components/providers/ToasterProvider";

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { toast } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [interactions, setInteractions] = useState<CustomerInteraction[]>([]);
  const [byCategory, setByCategory] = useState<Record<InquiryCategory, number> | null>(
    null,
  );
  const [aiAnalysis, setAiAnalysis] = useState<CustomerAIAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiCached, setAiCached] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/customers/${id}`).then((r) => r.json()),
      fetch(`/api/customers/${id}/interactions?limit=200`).then((r) => r.json()),
    ])
      .then(([cRes, iRes]) => {
        if (cRes.customer) {
          setCustomer(cRes.customer as Customer);
        } else {
          // フォールバック
          const fb = mockCustomers.find((c) => c.id === id);
          if (fb) setCustomer(fb);
        }
        // interactions が空配列の場合もデモ表示用に mockInteractions を使う
        if (iRes.interactions && iRes.interactions.length > 0) {
          setInteractions(iRes.interactions as CustomerInteraction[]);
        } else {
          setInteractions(mockInteractions.filter((i) => i.customerId === id));
        }
        if (iRes.byCategoryCount) setByCategory(iRes.byCategoryCount);
      })
      .catch(() => {
        // フォールバック完全モック
        const fb = mockCustomers.find((c) => c.id === id);
        if (fb) setCustomer(fb);
        setInteractions(mockInteractions.filter((i) => i.customerId === id));
      })
      .finally(() => setLoading(false));
  }, [id]);

  const runAiAnalysis = useCallback(async () => {
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/customers/${id}/ai-analysis`, {
        method: "POST",
      });
      const j = await res.json();
      if (!res.ok) {
        if (res.status === 429 && j.nextAvailableAt) {
          const nextAt = new Date(j.nextAvailableAt).toLocaleTimeString("ja-JP");
          throw new Error(`${j.error}(次回実行可:${nextAt})`);
        }
        throw new Error(j.error ?? "AI分析に失敗");
      }
      setAiAnalysis(j.analysis as CustomerAIAnalysis);
      setAiCached(Boolean(j.cached));
      toast(
        j.cached
          ? "24時間以内のキャッシュ結果を表示しています"
          : "AI分析が完了しました",
        "success",
      );
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "AI分析に失敗しました",
        "error",
      );
    } finally {
      setAnalyzing(false);
    }
  }, [id, toast]);

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          読み込み中...
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <Link
          href="/customers"
          className="text-sm text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          顧客一覧に戻る
        </Link>
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-12 text-center">
          <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">顧客が見つかりません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <Link
        href="/customers"
        className="text-sm text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        顧客一覧に戻る
      </Link>

      <div className="text-xs font-medium mb-3" style={{ color: "var(--muted)" }}>
        顧客対応・販売支援プロセス / 顧客カルテ
      </div>

      {/* Customer Header */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5 mb-5">
        <div className="flex items-start gap-4 flex-wrap">
          <Image
            src={customer.profileImageUrl}
            alt={customer.instagramHandle}
            width={80}
            height={80}
            className="w-20 h-20 rounded-full flex-shrink-0"
            unoptimized
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              @{customer.instagramHandle}
            </h1>
            {customer.displayName !== customer.instagramHandle && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                {customer.displayName}
              </p>
            )}
            <div className="flex items-center gap-2 flex-wrap mt-2">
              {customer.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                >
                  {tag}
                </span>
              ))}
              <StatusPill status={customer.status} />
            </div>
            {customer.notes && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 italic">
                メモ:{customer.notes}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <StatTile
            icon={<MessageCircle className="w-4 h-4 text-orange-500" />}
            label="累計接点"
            value={customer.totalInteractions}
          />
          <StatTile
            icon={<Heart className="w-4 h-4 text-pink-500" />}
            label="初回接点"
            value={new Date(customer.firstContactAt).toLocaleDateString("ja-JP")}
          />
          <StatTile
            icon={<Bookmark className="w-4 h-4 text-blue-500" />}
            label="最終接点"
            value={new Date(customer.lastContactAt).toLocaleDateString("ja-JP")}
          />
          <StatTile
            icon={<UserIcon className="w-4 h-4 text-emerald-500" />}
            label="属性"
            value={`${customer.gender ?? "—"} / ${customer.ageRange ?? "—"}`}
          />
        </div>
      </div>

      {/* AI Analysis Card */}
      <div className="bg-gradient-to-r from-purple-50 to-emerald-50 dark:from-purple-900/20 dark:to-emerald-900/20 border border-purple-100 dark:border-purple-800 rounded-xl p-5 mb-5">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              AI 顧客好み分析
            </h2>
            {aiCached && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                キャッシュ
              </span>
            )}
          </div>
          <button
            onClick={runAiAnalysis}
            disabled={analyzing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
          >
            {analyzing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {analyzing
              ? "分析中..."
              : aiAnalysis
                ? "再分析"
                : "AI分析を実行"}
          </button>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
          顧客の過去の接点履歴から、関心領域・対応の注意点・推奨対応をAIが要約します。1顧客につき1日1回まで実行できます。
        </p>
        {aiAnalysis ? (
          <div className="space-y-3">
            <AnalysisField title="関心領域" content={aiAnalysis.interests} />
            <AnalysisField title="対応の注意点" content={aiAnalysis.cautions} />
            <AnalysisField title="推奨対応サマリ" content={aiAnalysis.summary} />
            <p className="text-xs text-gray-400 dark:text-gray-500 italic">
              分析実行:{new Date(aiAnalysis.generatedAt).toLocaleString("ja-JP")}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            まだ分析を実行していません。「AI分析を実行」ボタンを押してください。
          </p>
        )}
      </div>

      {/* Category breakdown */}
      {byCategory && (
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5 mb-5">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <TagIcon className="w-4 h-4" />
            問い合わせカテゴリ別 集計
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <CategoryTile label="商品問い合わせ" count={byCategory.product_inquiry} cls="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300" />
            <CategoryTile label="営業時間" count={byCategory.business_hours} cls="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" />
            <CategoryTile label="クレーム" count={byCategory.complaint} cls="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" />
            <CategoryTile label="ポジティブ" count={byCategory.positive} cls="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" />
            <CategoryTile label="その他" count={byCategory.other} cls="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300" />
          </div>
        </div>
      )}

      {/* Interaction Timeline */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          接点履歴(時系列)
          <span className="text-xs text-gray-400 ml-1">{interactions.length} 件</span>
        </h2>
        {interactions.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
            接点履歴がありません
          </p>
        ) : (
          <div className="space-y-2">
            {interactions.map((it) => (
              <InteractionRow key={it.id} interaction={it} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: Customer["status"] }) {
  const map = {
    new: { label: "新規", cls: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" },
    active: { label: "対応中", cls: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" },
    vip: { label: "VIP", cls: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" },
    follow_up: { label: "要フォロー", cls: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300" },
    closed: { label: "対応済", cls: "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300" },
  };
  const m = map[status];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.cls}`}>
      {m.label}
    </span>
  );
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1">
        {icon}
        {label}
      </div>
      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {value}
      </div>
    </div>
  );
}

function AnalysisField({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <div className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">
        {title}
      </div>
      <div className="text-sm text-gray-800 dark:text-gray-100 bg-white/70 dark:bg-gray-800/70 rounded-lg px-3 py-2">
        {content}
      </div>
    </div>
  );
}

function CategoryTile({
  label,
  count,
  cls,
}: {
  label: string;
  count: number;
  cls: string;
}) {
  return (
    <div className={`rounded-lg px-3 py-2 ${cls}`}>
      <div className="text-xs font-medium">{label}</div>
      <div className="text-lg font-bold mt-0.5">{count}</div>
    </div>
  );
}

function InteractionRow({ interaction }: { interaction: CustomerInteraction }) {
  const typeLabel = {
    comment: { label: "コメント", cls: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" },
    reply_auto: { label: "AI自動返信", cls: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300" },
    reply_manual: { label: "手動返信", cls: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" },
    like: { label: "いいね", cls: "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300" },
    save: { label: "保存", cls: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" },
  }[interaction.type];

  return (
    <div className="border-l-2 border-emerald-200 dark:border-emerald-700 pl-3 py-2">
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeLabel.cls}`}>
          {typeLabel.label}
        </span>
        {interaction.category && (
          <CategoryBadge category={interaction.category} />
        )}
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(interaction.createdAt).toLocaleString("ja-JP", {
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <p className="text-sm text-gray-800 dark:text-gray-200">
        {interaction.content}
      </p>
    </div>
  );
}

function CategoryBadge({ category }: { category: InquiryCategory }) {
  const map = {
    product_inquiry: { label: "商品問い合わせ", cls: "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300" },
    business_hours: { label: "営業時間", cls: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" },
    complaint: { label: "クレーム", cls: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300" },
    positive: { label: "ポジティブ", cls: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" },
    other: { label: "その他", cls: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300" },
  };
  const m = map[category];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${m.cls}`}>
      {m.label}
    </span>
  );
}
