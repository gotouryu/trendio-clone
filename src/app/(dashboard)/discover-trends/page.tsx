"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Instagram, TrendingUp, Heart, Link2 } from "lucide-react";
import { industryOptions, mockTrends } from "@/lib/mockData";
import type { TrendItem } from "@/lib/types";
import { useToast } from "@/components/providers/ToasterProvider";
import { useLocalStorage } from "@/lib/useLocalStorage";

function DiscoverTrendsInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();

  const initialIndustry = params.get("industry") ?? "";
  const initialPlatform =
    (params.get("platform") as "all" | "instagram" | "tiktok" | null) ?? "all";

  const [industry, setIndustry] = useState(initialIndustry);
  const [platform, setPlatform] = useState<"all" | "instagram" | "tiktok">(
    initialPlatform,
  );
  const [results, setResults] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useLocalStorage<string[]>(
    "trendio-trend-favorites",
    [],
  );
  const [favOnly, setFavOnly] = useState(false);

  // Sync URL with state
  const syncURL = useCallback(
    (ind: string, plat: string) => {
      const sp = new URLSearchParams();
      if (ind) sp.set("industry", ind);
      if (plat && plat !== "all") sp.set("platform", plat);
      router.replace(`?${sp.toString()}`, { scroll: false });
    },
    [router],
  );

  useEffect(() => {
    syncURL(industry, platform);
  }, [industry, platform, syncURL]);

  function analyze() {
    if (!industry) return;
    setLoading(true);
    setTimeout(() => {
      const filtered = mockTrends.filter(
        (t) =>
          (platform === "all" || t.platform === platform) &&
          (!industry || t.industry === industry),
      );
      setResults(filtered);
      setLoading(false);
    }, 800);
  }

  function toggleFav(id: string) {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  }

  function copyURL() {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href);
    toast("URLをコピーしました", "success");
  }

  const visibleResults = favOnly
    ? results.filter((r) => favorites.includes(r.id))
    : results;

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Discover Trends
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Analyze the latest SNS trends by industry
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-6 mb-6">
        <div className="mb-5">
          <label
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            htmlFor="trend-industry"
          >
            Select Industry
          </label>
          <select
            id="trend-industry"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Please select an industry</option>
            {industryOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Platform
          </label>
          <div className="grid grid-cols-3 gap-2">
            <PlatformButton
              active={platform === "all"}
              onClick={() => setPlatform("all")}
            >
              All
            </PlatformButton>
            <PlatformButton
              active={platform === "instagram"}
              onClick={() => setPlatform("instagram")}
            >
              <Instagram className="w-4 h-4" />
              <span className="hidden sm:inline">Instagram</span>
              <span className="sm:hidden">IG</span>
            </PlatformButton>
            <PlatformButton
              active={platform === "tiktok"}
              onClick={() => setPlatform("tiktok")}
            >
              <span className="text-base">♪</span>
              TikTok
            </PlatformButton>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={analyze}
            disabled={!industry || loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-white font-medium bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>分析中...</>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Analyze Trends
              </>
            )}
          </button>
          <button
            onClick={copyURL}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
            aria-label="URLをコピー"
          >
            <Link2 className="w-4 h-4" />
            <span className="hidden sm:inline">URLをコピー</span>
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              分析結果 ({visibleResults.length} / {results.length})
            </h2>
            <button
              onClick={() => setFavOnly((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                favOnly
                  ? "bg-red-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              aria-pressed={favOnly}
            >
              <Heart
                className={`w-3.5 h-3.5 ${favOnly ? "fill-current" : ""}`}
              />
              お気に入りのみ表示
            </button>
          </div>
          {visibleResults.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-12 text-center text-gray-500 dark:text-gray-400">
              お気に入りに登録したトレンドはありません
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleResults.map((t) => {
                const isFav = favorites.includes(t.id);
                return (
                  <div
                    key={t.id}
                    className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-[3/4] relative bg-gray-100 dark:bg-gray-900">
                      <Image
                        src={t.thumbnail}
                        alt={t.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <div className="absolute top-3 left-3">
                        <span className="px-2 py-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur rounded-md text-xs font-medium flex items-center gap-1 text-gray-800 dark:text-gray-100">
                          {t.platform === "instagram" ? (
                            <Instagram className="w-3 h-3" />
                          ) : (
                            <span>♪</span>
                          )}
                          {t.platform === "instagram" ? "Instagram" : "TikTok"}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
                        <span className="px-2 py-1 bg-emerald-500 text-white rounded-md text-xs font-bold flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />+{t.growth}%
                        </span>
                        <button
                          onClick={() => toggleFav(t.id)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur ${
                            isFav
                              ? "bg-red-500 text-white"
                              : "bg-white/90 dark:bg-gray-900/90 text-gray-600 dark:text-gray-300 hover:bg-white"
                          }`}
                          aria-label={isFav ? "お気に入りから外す" : "お気に入りに追加"}
                          aria-pressed={isFav}
                        >
                          <Heart
                            className={`w-4 h-4 ${isFav ? "fill-current" : ""}`}
                          />
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {t.title}
                      </h3>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        {(t.views / 10000).toFixed(1)}万 視聴
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {t.hashtags.map((h) => (
                          <span
                            key={h}
                            className="text-xs px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full"
                          >
                            #{h}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PlatformButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-gradient-to-r from-emerald-400 to-emerald-500 text-white"
          : "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
      }`}
    >
      {children}
    </button>
  );
}

export default function DiscoverTrendsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500">Loading...</div>}>
      <DiscoverTrendsInner />
    </Suspense>
  );
}
