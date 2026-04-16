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

function AdCard({ ad }: { ad: Ad }) {
  const [imgError, setImgError] = useState(false);
  const hasThumbnail = !!ad.thumbnailUrl && !imgError;

  return (
    <div className="rounded-xl border border-[var(--color-border)] overflow-hidden hover:border-[var(--color-link)] transition-colors cursor-pointer">
      {/* Thumbnail */}
      <div className="aspect-square bg-[var(--color-surface)] relative overflow-hidden">
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
              <p className="text-2xl mb-1">
                {ad.format === "video" ? "▶" : "▣"}
              </p>
              <p className="text-xs text-[rgba(9,10,8,0.3)] capitalize">{ad.format}</p>
            </div>
          </div>
        )}
        <span
          className={clsx(
            "absolute top-2 right-2 text-2xs font-semibold px-1.5 py-0.5 rounded-full",
            STATUS_STYLES[ad.status]
          )}
        >
          {ad.status === "active" ? "Aktiv" : ad.status === "paused" ? "Pauset" : "Læring"}
        </span>
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
          <MetricCell label="ROAS" value={`${ad.roas.toFixed(1)}×`} />
          <MetricCell
            label="Spend"
            value={ad.spend >= 1000 ? `${Math.round(ad.spend / 1000)}k` : `${Math.round(ad.spend)}`}
          />
          <MetricCell label="CPA" value={`${Math.round(ad.cpa)} kr`} />
        </div>
      </div>
    </div>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-2xs text-[rgba(9,10,8,0.35)] uppercase tracking-wide leading-none mb-0.5">{label}</p>
      <p className="text-xs font-semibold" style={{ fontFamily: "var(--font-mono)" }}>{value}</p>
    </div>
  );
}

export default function AdGallery({ ads }: Props) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {ads.map((ad) => (
        <AdCard key={ad.id} ad={ad} />
      ))}
    </div>
  );
}
