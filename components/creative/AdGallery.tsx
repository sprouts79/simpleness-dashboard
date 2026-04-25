"use client";

import { useState, useEffect } from "react";
import { Ad } from "@/lib/types";
import Badge from "../ui/Badge";

const FORMAT_BADGE_COLOR: Record<Ad["format"], "purple" | "blue" | "orange" | "amber"> = {
  video:    "purple",
  static:   "blue",
  carousel: "orange",
  story:    "amber",
};

const FORMAT_LABEL: Record<Ad["format"], string> = {
  video:    "Video",
  static:   "Bilde",
  carousel: "Karusell",
  story:    "Story",
};

// ─── Video/image modal ────────────────────────────────────────────────────────

function Modal({ ad, onClose }: { ad: Ad; onClose: () => void }) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ad.format !== "video") return;
    setLoading(true);
    fetch(`/api/preview?adId=${ad.id}`)
      .then((r) => r.json())
      .then((d) => { if (d.videoUrl) setVideoUrl(d.videoUrl); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div
        className="relative"
        style={{ width: "min(420px, calc(100vw - 32px))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-black/50 text-white text-sm flex items-center justify-center"
        >
          ✕
        </button>
        {loading && (
          <div className="aspect-[9/16] rounded-2xl bg-black/30 flex items-center justify-center">
            <span className="text-white text-xs">Laster…</span>
          </div>
        )}
        {!loading && videoUrl ? (
          <video
            src={videoUrl}
            autoPlay
            controls
            playsInline
            className="w-full h-auto block rounded-2xl"
            style={{ maxHeight: "92vh" }}
          />
        ) : !loading ? (
          <img
            src={ad.thumbnailUrl}
            alt={ad.name}
            className="w-full h-auto block rounded-2xl"
            style={{ maxHeight: "92vh" }}
          />
        ) : null}
      </div>
    </div>
  );
}

// ─── Single ad tile ───────────────────────────────────────────────────────────

function AdTile({ ad }: { ad: Ad }) {
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <>
      <div
        className="rounded-xl border border-[var(--color-border)] bg-white cursor-pointer hover:border-[var(--color-border-strong)] hover:shadow-sm transition-all overflow-hidden"
        onClick={() => setOpen(true)}
      >
        {/* Thumbnail */}
        <div className="relative">
          {ad.thumbnailUrl && !imgError ? (
            <img
              src={ad.thumbnailUrl}
              alt={ad.name}
              onError={() => setImgError(true)}
              className="w-full aspect-[9/16] object-cover block"
            />
          ) : (
            <div className="aspect-[9/16] bg-[var(--color-surface)] flex items-center justify-center">
              <span className="text-3xl opacity-30">{ad.format === "video" ? "▶" : "▣"}</span>
            </div>
          )}
          <span className="absolute top-2 right-2">
            <Badge color={FORMAT_BADGE_COLOR[ad.format]}>{FORMAT_LABEL[ad.format]}</Badge>
          </span>
        </div>

        {/* Metrics */}
        <div className="px-3 py-3">
          <p className="text-sm font-medium leading-snug mb-2 line-clamp-2 text-[var(--color-fg)]">{ad.name}</p>
          <div className="flex gap-3 text-xs text-[var(--color-fg-muted)] tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
            <span>{ad.spend >= 1000 ? `${Math.round(ad.spend / 1000)}k` : Math.round(ad.spend)} kr</span>
            {ad.roas > 0 && <span>{ad.roas.toFixed(1)}×</span>}
            {ad.ctr > 0 && <span>{ad.ctr.toFixed(1)}%</span>}
          </div>
        </div>
      </div>

      {open && <Modal ad={ad} onClose={() => setOpen(false)} />}
    </>
  );
}

// ─── Gallery ──────────────────────────────────────────────────────────────────

export default function AdGallery({ ads }: { ads: Ad[] }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {ads.map((ad) => (
        <AdTile key={ad.id} ad={ad} />
      ))}
    </div>
  );
}
