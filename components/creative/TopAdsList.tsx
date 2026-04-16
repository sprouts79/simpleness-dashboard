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

// Lower is better for these metrics
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

function AdRow({
  ad,
  rank,
  metric,
}: {
  ad: Ad;
  rank: number;
  metric: CohortMetric;
}) {
  const [imgError, setImgError] = useState(false);
  const hasThumbnail = !!ad.thumbnailUrl && !imgError;
  const primaryValue = getMetricValue(ad, metric);

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface)] transition-colors">
      {/* Rank */}
      <span
        className="w-6 text-center text-xs font-semibold flex-shrink-0"
        style={{ fontFamily: "var(--font-mono)", color: rank <= 3 ? "var(--color-black)" : "rgba(9,10,8,0.3)" }}
      >
        {rank}
      </span>

      {/* Thumbnail */}
      <div className="w-9 h-9 rounded-md overflow-hidden flex-shrink-0 bg-[var(--color-surface)] border border-[var(--color-border)]">
        {hasThumbnail ? (
          <img
            src={ad.thumbnailUrl}
            alt=""
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-[rgba(9,10,8,0.2)]">
            {ad.format === "video" ? "▶" : "▣"}
          </div>
        )}
      </div>

      {/* Name */}
      <span className="flex-1 text-xs truncate text-[rgba(9,10,8,0.7)] min-w-0">{ad.name}</span>

      {/* Secondary metrics */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {metric !== "spend" && (
          <MetricPill label="Spend" value={ad.spend >= 1000 ? `${Math.round(ad.spend / 1000)}k` : `${Math.round(ad.spend)}`} />
        )}
        {metric !== "roas" && ad.roas > 0 && (
          <MetricPill label="ROAS" value={`${ad.roas.toFixed(1)}×`} />
        )}
        {metric !== "hookRate" && ad.format === "video" && ad.hookRate > 0 && (
          <MetricPill label="Hook" value={`${ad.hookRate.toFixed(0)}%`} />
        )}
        {metric !== "ctr" && (
          <MetricPill label="CTR" value={`${ad.ctr.toFixed(1)}%`} />
        )}
      </div>

      {/* Primary metric — highlighted */}
      <span
        className="w-16 text-right text-sm font-semibold flex-shrink-0"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {formatMetricValue(primaryValue, metric)}
      </span>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <p className="text-[10px] text-[rgba(9,10,8,0.3)] uppercase tracking-wide leading-none mb-0.5">{label}</p>
      <p className="text-xs font-medium" style={{ fontFamily: "var(--font-mono)" }}>{value}</p>
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

  const adsMap: Record<TopPeriod, Ad[]> = {
    week: topWeek,
    month: topMonth,
    quarter: topQuarter,
  };

  const rawAds = adsMap[period];
  const sorted = sortAds(rawAds, metric).slice(0, 10);

  if (!rawAds.length) {
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
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className="rounded-xl border border-[var(--color-border)] overflow-hidden bg-white">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <span className="w-6" />
          <span className="w-9 flex-shrink-0" />
          <span className="flex-1 text-[10px] font-semibold uppercase tracking-widest text-[rgba(9,10,8,0.4)]">Annonse</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[rgba(9,10,8,0.4)] w-16 text-right flex-shrink-0">
            {METRIC_OPTIONS.find(m => m.value === metric)?.label}
          </span>
        </div>
        {sorted.map((ad, i) => (
          <AdRow key={ad.id} ad={ad} rank={i + 1} metric={metric} />
        ))}
      </div>
    </div>
  );
}
