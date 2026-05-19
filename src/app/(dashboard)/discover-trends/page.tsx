"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, Instagram, TrendingUp } from "lucide-react";
import { industryOptions, mockTrends } from "@/lib/mockData";
import type { TrendItem } from "@/lib/types";

export default function DiscoverTrendsPage() {
  const [industry, setIndustry] = useState("");
  const [platform, setPlatform] = useState<"all" | "instagram" | "tiktok">("all");
  const [results, setResults] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Discover Trends</h1>
        <p className="text-sm text-gray-500 mt-1">
          Analyze the latest SNS trends by industry
        </p>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-6 mb-6">
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Industry
          </label>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
              Instagram
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

        <button
          onClick={analyze}
          disabled={!industry || loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-white font-medium bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>

      {results.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            分析結果 ({results.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((t) => (
              <div
                key={t.id}
                className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-[3/4] relative bg-gray-100">
                  <Image
                    src={t.thumbnail}
                    alt={t.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 bg-white/90 backdrop-blur rounded-md text-xs font-medium flex items-center gap-1">
                      {t.platform === "instagram" ? (
                        <Instagram className="w-3 h-3" />
                      ) : (
                        <span>♪</span>
                      )}
                      {t.platform === "instagram" ? "Instagram" : "TikTok"}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 bg-emerald-500 text-white rounded-md text-xs font-bold flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />+{t.growth}%
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {t.title}
                  </h3>
                  <div className="text-xs text-gray-500 mb-3">
                    {(t.views / 10000).toFixed(1)}万 視聴
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {t.hashtags.map((h) => (
                      <span
                        key={h}
                        className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full"
                      >
                        #{h}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
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
          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}
