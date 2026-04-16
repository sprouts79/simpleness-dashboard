"use client";

import { useState } from "react";
import { Ad } from "@/lib/types";
import clsx from "clsx";

interface Props {
  ads: Ad[];
}

const STATUS_STYLES: Record<Ad["status"], string> = {
  active: "bg-green-100 text-green-700",
  paused: "bg-yellow-100 text-yellow-700",
  learning: "bg-blue-100 text-blue-700",
};

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
      {/* explicit width (not maxWidth) so image fills container exactly */}
      <div
        className="relative shadow-2xl"
        style={{ width: "min(420px, calc(100vw - 32px))" }}
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
            className="rounded-2xl block w-full"
            style={{ maxHeight: "92vh" }}
          />
        ) : imageUrl ? (
          <img
            src={imageUrl}
            className="rounded-2xl block w-full h-auto"
            style={{ maxHeight: "92vh" }}
          />
        ) : null}
      </div>
    </div>
  );
}

// ─── Ad card ─────────────────────────────────────────────────────────────────

function AdCard({ ad }: { ad: Ad }) {
  const [imgError, setImgError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<{ videoUrl?: string; imageUrl?: string } | null>(null);
  const hasThumbnail = !!ad.thumbnailUrl && !imgError;

  async function openPreview() {
    if (isLoading) return;

    if (ad.format !== "video") {
      // Images: show full thumbnail in modal immediately — no API call
      if (ad.thumbnailUrl) setPreview({ imageUrl: ad.thumbnailUrl });
      return;
    }

    // Videos: fetch direct CDN source URL
    setIsLoading(true);
    try {
      const res = await fetch(`/api/preview?adId=${ad.id}`);
      const data = await res.json();
      if (data.videoUrl) {
        setPreview({ videoUrl: data.videoUrl });
      } else if (ad.thumbnailUrl) {
        // Source unavailable — fall back to thumbnail
        setPreview({ imageUrl: ad.thumbnailUrl });
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <div
        className="rounded-xl border border-[var(--color-border)] overflow-hidden hover:border-[var(--color-link)] transition-colors cursor-pointer group bg-white"
        onClick={openPreview}
      >
        {/* Thumbnail — natural aspect ratio, no forced crop */}
        <div className="bg-[var(--color-surface)] relative">
          {hasThumbnail ? (
            <img
              src={ad.thumbnailUrl}
              alt={ad.name}
              onError={() => setImgError(true)}
              className="w-full h-auto block"
            />
          ) : (
            <div className="aspect-[9/16] flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl mb-1">{ad.format === "video" ? "▶" : "▣"}</p>
                <p className="text-xs text-[rgba(9,10,8,0.3)] capitalize">{ad.format}</p>
              </div>
            </div>
          )}

          {/* Status badge */}
          <span
            className={clsx(
              "absolute top-2 right-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
              STATUS_STYLES[ad.status]
            )}
          >
            {ad.status === "active" ? "Aktiv" : ad.status === "paused" ? "Pauset" : "Læring"}
          </span>

          {/* Hover overlay — play icon for video only */}
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
        <div className="p-3">
          <p className="text-xs font-medium leading-tight mb-2 line-clamp-2 h-8">{ad.name}</p>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            {ad.format === "video" && ad.hookRate > 0 && (
              <>
                <MetricCell label="Hook" value={`${ad.hookRate.toFixed(0)}%`} />
                <MetricCell label="Hold" value={`${ad.holdRate.toFixed(0)}%`} />
              </>
            )}
            <MetricCell label="CTR" value={`${ad.ctr.toFixed(1)}%`} />
            {ad.roas > 0 && <MetricCell label="ROAS" value={`${ad.roas.toFixed(1)}×`} />}
            <MetricCell
              label="Spend"
              value={ad.spend >= 1000 ? `${Math.round(ad.spend / 1000)}k` : `${Math.round(ad.spend)}`}
            />
            {ad.cpa > 0 && <MetricCell label="CPA" value={`${Math.round(ad.cpa)} kr`} />}
          </div>
        </div>
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

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-[rgba(9,10,8,0.35)] uppercase tracking-wide leading-none mb-0.5">{label}</p>
      <p className="text-xs font-semibold" style={{ fontFamily: "var(--font-mono)" }}>{value}</p>
    </div>
  );
}

export default function AdGallery({ ads }: Props) {
  return (
    <div className="grid grid-cols-4 gap-4 items-start">
      {ads.map((ad) => (
        <AdCard key={ad.id} ad={ad} />
      ))}
    </div>
  );
}
