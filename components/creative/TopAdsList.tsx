"use client";

import { useState } from "react";
import { Ad, CohortMetric } from "@/lib/types";
import clsx from "clsx";

type TopPeriod = "week" | "month" | "quarter";

const PERIOD_OPTIONS: { value: TopPeriod; label: string }[] = [
  { value: "week", label: "Siste uke" },
  { value: "month", label: "Siste måned" },
  { value: "quarter", label: "Siste kvartal" },
];

const METRIC_OPTIONS: { value: CohortMetric; label: string }[] = [
  { value: "spend", label: "Spend" },
  { value: "roas", label: "ROAS" },
  { value: "ctr", label: "CTR" },
  { value: "hookRate", label: "Hook Rate" },
  { value: "cpa", label: "CPA" },
  { value: "cpm", label: "CPM" },
  { value: "holdRate", label: "Hold Rate" },
];

const LOWER_IS_BETTER = new Set<CohortMetric>(["cpa", "cpm"]);

function getMetricValue(ad: Ad, metric: CohortMetric): number {
  switch (metric) {
    case "spend": return ad.spend;
    case "roas": return ad.roas;
    case "ctr": return ad.ctr;
    case "hookRate": return ad.hookRate;
    case "holdRate": return ad.holdRate;
    case "cpa": return ad.cpa;
    case "cpm": return ad.cpm;
  }
}

function formatMetricValue(value: number, metric: CohortMetric): string {
  switch (metric) {
    case "spend": return value >= 1000 ? `${Math.round(value / 1000)}k` : `${Math.round(value)}`;
    case "roas": return `${value.toFixed(1)}×`;
    case "ctr":
    case "hookRate":
    case "holdRate": return `${value.toFixed(1)}%`;
    case "cpa":
    case "cpm": return `${Math.round(value)} kr`;
  }
}

function sortAds(ads: Ad[], metric: CohortMetric): Ad[] {
  return [...ads].sort((a, b) =>
    LOWER_IS_BETTER.has(metric)
      ? getMetricValue(a, metric) - getMetricValue(b, metric)
      : getMetricValue(b, metric) - getMetricValue(a, metric)
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-[rgba(9,10,8,0.35)] uppercase tracking-wide leading-none mb-0.5">{label}</p>
      <p className="text-xs font-semibold" style={{ fontFamily: "var(--font-mono)" }}>{value}</p>
    </div>
  );
}

function AdCard({ ad, rank, metric }: { ad: Ad; rank: number; metric: CohortMetric }) {
  const [imgError, setImgError] = useState(false);
  const hasThumbnail = !!ad.thumbnailUrl && !imgError;

  return (
    <div className="rounded-xl border border-[var(--color-border)] overflow-hidden bg-white">
      {/* Thumbnail */}
      <div className="aspect-[4/5] bg-[var(--color-surface)] relative overflow-hidden">
        {hasThumbnail ? (
          <img
            src={ad.thumbnailUrl}
            alt={ad.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-3xl mb-1">{ad.format === "video" ? "▶" : "▣"}</p>
              <p className="text-xs text-[rgba(9,10,8,0.3)] capitalize">{ad.format}</p>
            </div>
          </div>
        )}

        {/* Rank badge */}
        <span
          className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/60 text-white text-xs font-bold flex items-center justify-center"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {rank}
        </span>

        {/* Primary metric badge */}
        <span
          className="absolute bottom-2 right-2 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded-md"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {formatMetricValue(getMetricValue(ad, metric), metric)}
        </span>
      </div>

      {/* Metrics */}
      <div className="p-3">
        <p className="text-xs font-medium leading-tight mb-3 line-clamp-2 h-8">{ad.name}</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          {metric !== "spend" && (
            <MetricCell
              label="Spend"
              value={ad.spend >= 1000 ? `${Math.round(ad.spend / 1000)}k` : `${Math.round(ad.spend)}`}
            />
          )}
          {metric !== "roas" && ad.roas > 0 && (
            <MetricCell label="ROAS" value={`${ad.roas.toFixed(1)}×`} />
          )}
          {ad.format === "video" && ad.hookRate > 0 && metric !== "hookRate" && (
            <MetricCell label="Hook" value={`${ad.hookRate.toFixed(0)}%`} />
          )}
          {metric !== "ctr" && (
            <MetricCell label="CTR" value={`${ad.ctr.toFixed(1)}%`} />
          )}
          {metric !== "cpa" && ad.cpa > 0 && (
            <MetricCell label="CPA" value={`${Math.round(ad.cpa)} kr`} />
          )}
          {metric !== "cpm" && ad.cpm > 0 && (
            <MetricCell label="CPM" value={`${Math.round(ad.cpm)} kr`} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function TopAdsList({
  topWeek,
  topMonth,
  topQuarter,
}: {
  topWeek: Ad[];
  topMonth: Ad[];
  topQuarter: Ad[];
}) {
  const [period, setPeriod] = useState<TopPeriod>("month");
  const [metric, setMetric] = useState<CohortMetric>("spend");

  const adsMap: Record<TopPeriod, Ad[]> = { week: topWeek, month: topMonth, quarter: topQuarter };
  const sorted = sortAds(adsMap[period], metric).slice(0, 12);

  if (!adsMap[period].length) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] p-8 text-center">
        <p className="text-sm text-[rgba(9,10,8,0.4)]">Ingen annonsedata for perioden.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex bg-[var(--color-surface)] rounded-lg p-1 gap-1">
          {PERIOD_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={clsx(
                "text-xs font-semibold px-3 py-1.5 rounded-md transition-colors whitespace-nowrap",
                period === value
                  ? "bg-white text-[var(--color-black)] shadow-sm"
                  : "text-[rgba(9,10,8,0.45)] hover:text-[var(--color-black)]"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value as CohortMetric)}
          className="text-xs font-semibold bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-black)] cursor-pointer"
        >
          {METRIC_OPTIONS.map((m) => (
            <option key={m.value} value={m.value}>Sorter: {m.label}</option>
          ))}
        </select>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-3 gap-4">
        {sorted.map((ad, i) => (
          <AdCard key={ad.id} ad={ad} rank={i + 1} metric={metric} />
        ))}
      </div>
    </div>
  );
}
