"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Filter,
  Users,
  TrendingUp,
  ChevronRight,
  Tag as TagIcon,
} from "lucide-react";
import type { Customer, CustomerStatus, CustomerTag } from "@/lib/types";
import { mockCustomers } from "@/lib/mockData";
import KarteiaProcessBar, {
  KarteiaWelcomeHeader,
} from "@/components/KarteiaProcessBar";
import { getSession } from "@/lib/authClient";
import { useI18n } from "@/lib/i18n";

const statusOptions: { value: CustomerStatus | "all"; labelKey: string; cls: string }[] = [
  { value: "all", labelKey: "customers.status.all", cls: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200" },
  { value: "new", labelKey: "customers.status.new", cls: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" },
  { value: "active", labelKey: "customers.status.active", cls: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" },
  { value: "vip", labelKey: "customers.status.vip", cls: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" },
  { value: "follow_up", labelKey: "customers.status.follow_up", cls: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300" },
  { value: "closed", labelKey: "customers.status.closed", cls: "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300" },
];

const allTags: CustomerTag[] = [
  "VIP",
  "既存顧客",
  "問い合わせ多",
  "新規",
  "リピーター",
  "クレーム経験",
];

export default function CustomersPage() {
  const { t } = useI18n();
  // 初期値は空。API 接続後に「実データ or mockData フォールバック」を決定
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CustomerStatus | "all">("all");
  const [tagFilter, setTagFilter] = useState<CustomerTag | "all">("all");
  const [query, setQuery] = useState("");
  const [displayName, setDisplayName] = useState("お客様");

  useEffect(() => {
    const s = getSession();
    if (s?.displayName) setDisplayName(s.displayName);
    (async () => {
      try {
        const r = await fetch("/api/customers?limit=200");
        // API 到達失敗時のみ mock 表示。到達済 = 本番接続済として 0 件をそのまま表示
        if (!r.ok) {
          setCustomers(mockCustomers);
          return;
        }
        const j = await r.json();
        if (Array.isArray(j.customers)) {
          // j.mock === true (=Supabase 未設定) なら API はモックを返す、それでも表示
          setCustomers(j.customers as Customer[]);
        } else {
          setCustomers(mockCustomers);
        }
      } catch {
        setCustomers(mockCustomers);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let list = customers;
    if (filter !== "all") list = list.filter((c) => c.status === filter);
    if (tagFilter !== "all") list = list.filter((c) => c.tags.includes(tagFilter));
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.instagramHandle.toLowerCase().includes(q) ||
          c.displayName.toLowerCase().includes(q),
      );
    }
    return list;
  }, [customers, filter, tagFilter, query]);

  const stats = useMemo(() => {
    const total = customers.length;
    const newCount = customers.filter((c) => c.status === "new").length;
    const vipCount = customers.filter((c) => c.status === "vip").length;
    const followUpCount = customers.filter((c) => c.status === "follow_up").length;
    return { total, newCount, vipCount, followUpCount };
  }, [customers]);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <KarteiaProcessBar current="records" />
      <KarteiaWelcomeHeader
        greeting={t("greeting.welcome", { name: displayName })}
        title={t("customers.title")}
        subtitle={
          stats.total > 0
            ? t("customers.subtitle.withData", {
                total: stats.total,
                newCount: stats.newCount,
                followUp: stats.followUpCount,
              })
            : t("customers.subtitle.noData")
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={<Users className="w-4 h-4 text-orange-500" />}
          label={t("customers.stats.total")}
          value={stats.total}
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4 text-blue-500" />}
          label={t("customers.stats.new")}
          value={stats.newCount}
        />
        <StatCard
          icon={<TagIcon className="w-4 h-4 text-amber-500" />}
          label={t("customers.stats.vip")}
          value={stats.vipCount}
        />
        <StatCard
          icon={<Filter className="w-4 h-4 text-orange-500" />}
          label={t("customers.stats.followUp")}
          value={stats.followUpCount}
        />
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("customers.search")}
          className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Status Filter */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3 mb-3 flex items-center gap-2 overflow-x-auto">
        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-1">
          {t("customers.filterStatus")}
        </span>
        {statusOptions.map((o) => (
          <button
            key={o.value}
            onClick={() => setFilter(o.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              filter === o.value
                ? "bg-emerald-500 text-white"
                : `${o.cls} hover:opacity-80`
            }`}
          >
            {t(o.labelKey)}
          </button>
        ))}
      </div>

      {/* Tag Filter */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3 mb-4 flex items-center gap-2 overflow-x-auto">
        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-1">
          {t("customers.filterTag")}
        </span>
        <button
          onClick={() => setTagFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
            tagFilter === "all"
              ? "bg-emerald-500 text-white"
              : "bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
          }`}
        >
          {t("customers.status.all")}
        </button>
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setTagFilter(tag)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              tagFilter === tag
                ? "bg-emerald-500 text-white"
                : "bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            }`}
          >
            {t(`customers.tag.${tag}`)}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        {t("customers.count", { n: filtered.length })}
        {loading && " " + t("customers.loading")}
      </p>

      {/* Customer List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {t("customers.empty")}
            </p>
          </div>
        ) : (
          filtered.map((c) => <CustomerRow key={c.id} customer={c} />)
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
          {icon}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          {label}
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function CustomerRow({ customer }: { customer: Customer }) {
  const { t, locale } = useI18n();
  const statusOption = statusOptions.find((o) => o.value === customer.status);
  return (
    <Link
      href={`/customers/${customer.id}`}
      className="block bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 hover:shadow-sm hover:border-emerald-200 dark:hover:border-emerald-800 transition-all"
    >
      <div className="flex items-center gap-4">
        <Image
          src={customer.profileImageUrl}
          alt={customer.instagramHandle}
          width={48}
          height={48}
          className="w-12 h-12 rounded-full flex-shrink-0"
          unoptimized
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              @{customer.instagramHandle}
            </span>
            {statusOption && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusOption.cls}`}
              >
                {t(statusOption.labelKey)}
              </span>
            )}
            {customer.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
              >
                {t(`customers.tag.${tag}`)}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
            <span>
              {t("customers.lastContact")}:{" "}
              {new Date(customer.lastContactAt).toLocaleString(
                locale === "en" ? "en-US" : "ja-JP",
                { year: "numeric", month: "2-digit", day: "2-digit" },
              )}
            </span>
            <span>
              {t("customers.totalInteractions")}: {customer.totalInteractions}
            </span>
            {customer.region && <span>{customer.region}</span>}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
      </div>
    </Link>
  );
}
