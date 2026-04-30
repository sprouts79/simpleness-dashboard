"use client";

import { useMemo } from "react";
import { AdLabRow } from "@/lib/types";
import { CHART_COLORS } from "@/lib/chart-colors";

type ViewMode = "calendar" | "since_launch";

interface Props {
  ads: AdLabRow[];
  viewMode: ViewMode;
  metric: "spend" | "purchases" | "roas";
}

function formatSpend(v: number) {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${Math.round(v / 1000)}k`;
  return `${Math.round(v)}`;
}

function formatWeekLabel(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  const months = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];
  return `${parseInt(day)}. ${months[parseInt(month) - 1]}`;
}

function buildCohortColors(ads: AdLabRow[]): Map<string, string> {
  const cohortDates = Array.from(new Set(ads.map((a) => a.cohortDate))).sort();
  const map = new Map<string, string>();
  cohortDates.forEach((date, i) => {
    map.set(date, CHART_COLORS[i % CHART_COLORS.length]);
  });
  return map;
}

export default function AdHeatStrip({ ads, viewMode, metric }: Props) {
  const cohortColors = useMemo(() => buildCohortColors(ads), [ads]);

  const { weekLabels, weekKeys, maxValue } = useMemo(() => {
    if (viewMode === "calendar") {
      const all = new Set<string>();
      for (const ad of ads) for (const w of ad.weeks) all.add(w.weekStart);
      const keys = Array.from(all).sort();
      let max = 0;
      for (const ad of ads)
        for (const w of ad.weeks) {
          const v = metric === "spend" ? w.spend : metric === "purchases" ? w.purchases : (w.spend > 0 ? w.purchaseValue / w.spend : 0);
          if (v > max) max = v;
        }
      return { weekLabels: keys.map(formatWeekLabel), weekKeys: keys, maxValue: max };
    }
    let maxLen = 0;
    for (const ad of ads) if (ad.weeks.length > maxLen) maxLen = ad.weeks.length;
    let max = 0;
    for (const ad of ads)
      for (const w of ad.weeks) {
        const v = metric === "spend" ? w.spend : metric === "purchases" ? w.purchases : (w.spend > 0 ? w.purchaseValue / w.spend : 0);
        if (v > max) max = v;
      }
    return {
      weekLabels: Array.from({ length: maxLen }, (_, i) => `U${i}`),
      weekKeys: Array.from({ length: maxLen }, (_, i) => `idx-${i}`),
      maxValue: max,
    };
  }, [ads, viewMode, metric]);

  // Sort: cohort ascending, then total spend descending (within cohort)
  const orderedAds = useMemo(() => {
    return [...ads].sort((a, b) => {
      if (a.cohortDate !== b.cohortDate) return a.cohortDate.localeCompare(b.cohortDate);
      return b.totalSpend - a.totalSpend;
    });
  }, [ads]);

  if (orderedAds.length === 0 || weekKeys.length === 0) {
    return (
      <div className="text-sm text-neutral-500 text-center py-12">
        Ingen annonser å vise — juster filtrene.
      </div>
    );
  }

  function getValue(ad: AdLabRow, weekIdx: number): number {
    if (viewMode === "calendar") {
      const w = ad.weeks.find((x) => x.weekStart === weekKeys[weekIdx]);
      if (!w) return 0;
      return metric === "spend" ? w.spend : metric === "purchases" ? w.purchases : (w.spend > 0 ? w.purchaseValue / w.spend : 0);
    }
    const sorted = [...ad.weeks].sort((a, b) => a.weekStart.localeCompare(b.weekStart));
    const w = sorted[weekIdx];
    if (!w) return 0;
    return metric === "spend" ? w.spend : metric === "purchases" ? w.purchases : (w.spend > 0 ? w.purchaseValue / w.spend : 0);
  }

  function intensity(value: number): number {
    if (maxValue === 0) return 0;
    // Square-root scaling so small values are visible but big values still stand out
    return Math.sqrt(value / maxValue);
  }

  function formatValue(value: number): string {
    if (value === 0) return "";
    if (metric === "roas") return value.toFixed(1) + "x";
    if (metric === "purchases") return Math.round(value).toString();
    return formatSpend(value);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs" style={{ fontFamily: "var(--font-mono)" }}>
        <thead>
          <tr>
            <th className="text-left font-medium text-neutral-500 py-2 pr-4 sticky left-0 bg-white z-10" style={{ minWidth: 220 }}>
              Annonse
            </th>
            <th className="text-right font-medium text-neutral-500 py-2 pr-4" style={{ minWidth: 70 }}>
              Total
            </th>
            {weekLabels.map((label, i) => (
              <th key={i} className="text-center font-medium text-neutral-400 py-2 px-1" style={{ minWidth: 36 }}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orderedAds.map((ad) => {
            const cohortColor = cohortColors.get(ad.cohortDate) ?? "#888";
            const total =
              metric === "spend"
                ? ad.totalSpend
                : metric === "purchases"
                  ? ad.totalPurchases
                  : ad.totalSpend > 0
                    ? ad.totalPurchaseValue / ad.totalSpend
                    : 0;
            return (
              <tr key={ad.adId} className="border-t border-neutral-100 hover:bg-neutral-50/40">
                <td className="py-1 pr-4 sticky left-0 bg-white" style={{ minWidth: 220 }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-2 h-7 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: cohortColor }}
                      title={ad.cohortLabel}
                    />
                    <div className="w-7 h-7 rounded bg-neutral-100 overflow-hidden flex-shrink-0">
                      {ad.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={ad.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <span className="truncate text-neutral-800" title={ad.adName}>
                      {ad.adName}
                    </span>
                  </div>
                </td>
                <td className="py-1 pr-4 text-right tabular-nums font-semibold text-neutral-800">
                  {formatValue(total)}
                </td>
                {weekLabels.map((_, i) => {
                  const value = getValue(ad, i);
                  const t = intensity(value);
                  return (
                    <td key={i} className="text-center px-1 py-1">
                      <div
                        className="rounded-sm h-7 flex items-center justify-center text-[10px] tabular-nums"
                        style={{
                          backgroundColor: value > 0 ? cohortColor : "transparent",
                          opacity: value > 0 ? 0.15 + t * 0.85 : 0,
                          color: t > 0.5 ? "#fff" : "#1a1a1a",
                        }}
                        title={value > 0 ? formatValue(value) : ""}
                      >
                        {value > 0 && t > 0.35 ? formatValue(value) : ""}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
