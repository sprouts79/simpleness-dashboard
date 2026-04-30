"use client";

import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AdLabRow } from "@/lib/types";
import { CHART_COLORS, CHART_GRID_COLOR, CHART_AXIS_COLOR } from "@/lib/chart-colors";

type ViewMode = "calendar" | "since_launch";

interface Props {
  ads: AdLabRow[];
  viewMode: ViewMode;
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

// Map cohortDate → color from CHART_COLORS palette (oldest cohort = lightest)
function buildCohortColors(ads: AdLabRow[]): Map<string, string> {
  const cohortDates = Array.from(new Set(ads.map((a) => a.cohortDate))).sort();
  const map = new Map<string, string>();
  cohortDates.forEach((date, i) => {
    map.set(date, CHART_COLORS[i % CHART_COLORS.length]);
  });
  return map;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label, ads, cohortColors }: any) => {
  if (!active || !payload?.length) return null;

  const valid = payload
    .filter((p: { value: number }) => p.value > 0)
    .sort((a: { value: number }, b: { value: number }) => b.value - a.value);

  const total = valid.reduce((sum: number, p: { value: number }) => sum + p.value, 0);

  // Group by cohort for the tooltip
  type Bucket = { color: string; total: number; topAd?: { name: string; spend: number } };
  const byCohort = new Map<string, Bucket>();
  for (const entry of valid) {
    const ad = ads.find((a: AdLabRow) => a.adId === entry.dataKey);
    if (!ad) continue;
    const existing: Bucket = byCohort.get(ad.cohortLabel) ?? {
      color: cohortColors.get(ad.cohortDate) ?? "#888",
      total: 0,
    };
    existing.total += entry.value;
    if (!existing.topAd || entry.value > existing.topAd.spend) {
      existing.topAd = { name: ad.adName, spend: entry.value };
    }
    byCohort.set(ad.cohortLabel, existing);
  }

  return (
    <div className="bg-white border border-[var(--color-border)] rounded-lg px-3 py-2.5 shadow-sm min-w-[220px] max-w-[300px]">
      <p className="text-xs font-medium text-[var(--color-fg-muted)] mb-2">{label}</p>
      <div className="space-y-1.5">
        {Array.from(byCohort.entries())
          .sort(([, a], [, b]) => b.total - a.total)
          .slice(0, 6)
          .map(([cohort, info]) => (
            <div key={cohort} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 min-w-0">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: info.color }}
                />
                <span className="text-xs text-[var(--color-fg-muted)] truncate">{cohort}</span>
              </div>
              <span
                className="text-xs font-semibold tabular-nums text-[var(--color-fg)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {formatSpend(info.total)}
              </span>
            </div>
          ))}
      </div>
      <div className="pt-1.5 mt-1.5 border-t border-[var(--color-border)] flex justify-between items-baseline">
        <span className="text-xs text-[var(--color-fg-muted)]">{valid.length} annonser totalt</span>
        <span
          className="text-sm font-bold tabular-nums text-[var(--color-fg)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {formatSpend(total)}
        </span>
      </div>
    </div>
  );
};

export default function AdSpendStream({ ads, viewMode }: Props) {
  const [hoveredAdId, setHoveredAdId] = useState<string | null>(null);
  const cohortColors = useMemo(() => buildCohortColors(ads), [ads]);

  // Order ads in stack: by cohort ascending, then by total spend desc (top spenders on top within cohort)
  const orderedAds = useMemo(() => {
    return [...ads].sort((a, b) => {
      if (a.cohortDate !== b.cohortDate) return a.cohortDate.localeCompare(b.cohortDate);
      return b.totalSpend - a.totalSpend;
    });
  }, [ads]);

  const { chartData, xKey, xLabels } = useMemo(() => {
    if (viewMode === "calendar") {
      // X axis = calendar weeks. Find all unique week starts across ads.
      const allWeeks = new Set<string>();
      for (const ad of ads) for (const w of ad.weeks) allWeeks.add(w.weekStart);
      const sortedWeeks = Array.from(allWeeks).sort();

      const data = sortedWeeks.map((week) => {
        const row: Record<string, number | string> = { _label: formatWeekLabel(week) };
        for (const ad of orderedAds) {
          const w = ad.weeks.find((x) => x.weekStart === week);
          row[ad.adId] = w?.spend ?? 0;
        }
        return row;
      });
      return { chartData: data, xKey: "_label", xLabels: sortedWeeks.map(formatWeekLabel) };
    } else {
      // X axis = weeks since each ad's launch (cohort-aligned)
      let maxWeeks = 0;
      for (const ad of ads) {
        if (ad.weeks.length > maxWeeks) maxWeeks = ad.weeks.length;
      }
      const indexes = Array.from({ length: maxWeeks }, (_, i) => i);
      const data = indexes.map((i) => {
        const row: Record<string, number | string> = { _label: `U${i}` };
        for (const ad of orderedAds) {
          // Sort weeks by start, then take the i-th if exists
          const sortedAdWeeks = [...ad.weeks].sort((a, b) => a.weekStart.localeCompare(b.weekStart));
          row[ad.adId] = sortedAdWeeks[i]?.spend ?? 0;
        }
        return row;
      });
      return { chartData: data, xKey: "_label", xLabels: indexes.map((i) => `U${i}`) };
    }
  }, [orderedAds, ads, viewMode]);

  if (chartData.length === 0) {
    return (
      <div className="h-[360px] flex items-center justify-center text-sm text-neutral-500">
        Ingen data å vise — juster filtrene.
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={420}>
        <AreaChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
          <CartesianGrid strokeDasharray="0" stroke={CHART_GRID_COLOR} vertical={false} />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 11, fill: CHART_AXIS_COLOR, fontFamily: "var(--font-mono)" }}
            tickLine={false}
            axisLine={false}
            dy={8}
            interval="preserveStartEnd"
            minTickGap={20}
          />
          <YAxis
            tick={{ fontSize: 11, fill: CHART_AXIS_COLOR, fontFamily: "var(--font-mono)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatSpend}
            width={48}
          />
          <Tooltip
            content={<CustomTooltip ads={ads} cohortColors={cohortColors} />}
            cursor={{ stroke: CHART_AXIS_COLOR, strokeDasharray: "3 3" }}
          />
          {orderedAds.map((ad) => {
            const baseColor = cohortColors.get(ad.cohortDate) ?? "#888";
            const isHovered = hoveredAdId === ad.adId;
            const isDimmed = hoveredAdId !== null && !isHovered;
            return (
              <Area
                key={ad.adId}
                type="monotone"
                dataKey={ad.adId}
                stackId="1"
                stroke={baseColor}
                strokeWidth={isHovered ? 1.5 : 0.5}
                strokeOpacity={isHovered ? 1 : 0.4}
                fill={baseColor}
                fillOpacity={isDimmed ? 0.15 : 0.85}
                name={ad.adName}
                onMouseEnter={() => setHoveredAdId(ad.adId)}
                onMouseLeave={() => setHoveredAdId(null)}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
      <p className="text-xs text-neutral-500 mt-2">
        {orderedAds.length} annonser stablet. Farge = kohort (lansering-uke). Hover for detaljer.
        {viewMode === "since_launch" ? " Tidsakse: uker siden hver annonse fikk sin første spend." : " Tidsakse: kalendertid."}
      </p>
    </div>
  );
}
