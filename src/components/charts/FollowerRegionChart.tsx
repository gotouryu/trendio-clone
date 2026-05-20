"use client";

import type { RegionItem } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

export default function FollowerRegionChart({ data }: { data: RegionItem[] }) {
  const { t } = useI18n();
  const max = Math.max(...data.map((d) => d.percentage));
  // r.name が i18n key (=`region.tokyo`)の場合は翻訳、そうでなければそのまま表示
  const label = (raw: string) =>
    raw.startsWith("region.") ? t(raw) : raw;
  return (
    <div className="space-y-2.5">
      {data.map((r) => (
        <div key={r.name} className="flex items-center gap-3 text-sm">
          <div className="w-24 truncate text-gray-700" title={label(r.name)}>
            {label(r.name)}
          </div>
          <div className="flex-1 bg-orange-50 rounded h-5 relative overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded"
              style={{ width: `${(r.percentage / max) * 100}%` }}
            />
          </div>
          <div className="w-12 text-right font-medium text-gray-700">
            {r.percentage.toFixed(1)} %
          </div>
          <div className="w-8 text-right text-gray-500">{r.count}</div>
        </div>
      ))}
    </div>
  );
}
