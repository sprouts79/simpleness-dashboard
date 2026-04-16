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

// ─── Preview modal ────────────────────────────────────────────────────────────

function PreviewModal({
  videoUrl,
  imageUrl,
  onClose,
}: {
  videoUrl?: string;
  imageUrl?: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="relative bg-black rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center"
        style={{ maxWidth: "min(420px, calc(100vw - 32px))", maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-black/50 text-white text-sm flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          ✕
        </button>
        {videoUrl ? (
          <video
            src={videoUrl}
            autoPlay
            controls
            playsInline
            style={{ maxWidth: "min(420px, calc(100vw - 32px))", maxHeight: "92vh", display: "block" }}
          />
        ) : imageUrl ? (
          <img
            src={imageUrl}
            style={{ maxWidth: "min(420px, calc(100vw - 32px))", maxHeight: "92vh", width: "auto", height: "auto", display: "block" }}
          />
        ) : null}
      </div>
    </div>
  );
}

// ─── Ad card ─────────────────────────────────────────────────────────────────

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-[rgba(9,10,8,0.35)] uppercase tracking-wide leading-none mb-0.5">{label}</p>
      <p className="text-xs font-semibold" style={{ fontFamily: "var(--font-mono)" }}>{value}</p>
    </div>
  );
}

function AdCard({
  ad,
  rank,
  metric,
  onOpen,
  isLoading,
}: {
  ad: Ad;
  rank: number;
  metric: CohortMetric;
  onOpen: () => void;
  isLoading: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const hasThumbnail = !!ad.thumbnailUrl && !imgError;

  return (
    <div
      className="rounded-xl border border-[var(--color-border)] overflow-hidden bg-white cursor-pointer group hover:border-[var(--color-link)] transition-colors"
      onClick={onOpen}
    >
      {/* Thumbnail — fixed 9:16 container, object-contain so neither 1:1 nor 9:16 is cropped */}
      <div className="aspect-[9/16] bg-[var(--color-surface)] relative overflow-hidden">
        {hasThumbnail ? (
          <img
            src={ad.thumbnailUrl}
            alt={ad.name}
            onError={() => setImgError(true)}
            className="absolute inset-0 w-full h-full object-contain"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl mb-1">{ad.format === "video" ? "▶" : "▣"}</p>
              <p className="text-[10px] text-[rgba(9,10,8,0.3)] capitalize">{ad.format}</p>
            </div>
          </div>
        )}

        {/* Rank */}
        <span
          className="absolute top-2 left-2 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] font-bold flex items-center justify-center"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {rank}
        </span>

        {/* Primary metric */}
        <span
          className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {formatMetricValue(getMetricValue(ad, metric), metric)}
        </span>

        {/* Hover overlay — play icon for video, dim-only for images */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
          {ad.format === "video" && (
            <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
              {isLoading ? (
                <span className="text-xs">...</span>
              ) : (
                <span className="text-sm ml-0.5">▶</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="p-2.5">
        <p className="text-[11px] font-medium leading-tight mb-2 line-clamp-2 h-7">{ad.name}</p>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
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
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

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
  const [preview, setPreview] = useState<{ videoUrl?: string; imageUrl?: string } | null>(null);
  const [loadingAdId, setLoadingAdId] = useState<string | null>(null);

  const adsMap: Record<TopPeriod, Ad[]> = { week: topWeek, month: topMonth, quarter: topQuarter };
  const sorted = sortAds(adsMap[period], metric).slice(0, 12);

  async function openPreview(ad: Ad) {
    if (loadingAdId) return;

    if (ad.format !== "video") {
      // Non-video: show thumbnail in modal — no API call needed
      if (ad.thumbnailUrl) setPreview({ imageUrl: ad.thumbnailUrl });
      return;
    }

    // Video: fetch direct source URL for inline playback
    setLoadingAdId(ad.id);
    try {
      const res = await fetch(`/api/preview?adId=${ad.id}`);
      const data = await res.json();
      if (data.videoUrl) {
        setPreview({ videoUrl: data.videoUrl });
      } else if (ad.thumbnailUrl) {
        // Source URL unavailable — fall back to showing thumbnail
        setPreview({ imageUrl: ad.thumbnailUrl });
      }
    } finally {
      setLoadingAdId(null);
    }
  }

  if (!adsMap[period].length) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] p-8 text-center">
        <p className="text-sm text-[rgba(9,10,8,0.4)]">Ingen annonsedata for perioden.</p>
      </div>
    );
  }

  return (
    <>
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

      {/* Card grid — 4 columns */}
      <div className="grid grid-cols-4 gap-3">
        {sorted.map((ad, i) => (
          <AdCard
            key={ad.id}
            ad={ad}
            rank={i + 1}
            metric={metric}
            onOpen={() => openPreview(ad)}
            isLoading={loadingAdId === ad.id}
          />
        ))}
      </div>

      {preview && (
        <PreviewModal
          videoUrl={preview.videoUrl}
          imageUrl={preview.imageUrl}
          onClose={() => setPreview(null)}
        />
      )}
    </>
  );
}
