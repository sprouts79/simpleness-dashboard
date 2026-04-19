"use client";

import { useState, useEffect } from "react";
import { Ad } from "@/lib/types";

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
        className="rounded-xl border border-[var(--color-border)] bg-white cursor-pointer hover:border-[var(--color-link)] transition-colors overflow-hidden"
        onClick={() => setOpen(true)}
      >
        {/* Image at its natural dimensions — no forced crop, no aspect ratio override */}
        {ad.thumbnailUrl && !imgError ? (
          <img
            src={ad.thumbnailUrl}
            alt={ad.name}
            onError={() => setImgError(true)}
            className="w-full h-auto block"
          />
        ) : (
          <div className="aspect-[9/16] bg-[#f8f8f7] flex items-center justify-center">
            <span className="text-3xl opacity-30">{ad.format === "video" ? "▶" : "▣"}</span>
          </div>
        )}

        {/* Metrics */}
        <div className="px-3 py-2.5">
          <p className="text-[11px] font-semibold leading-snug mb-1.5 line-clamp-2">{ad.name}</p>
          <div className="flex gap-2.5 text-[11px] text-[rgba(9,10,8,0.4)]" style={{ fontFamily: "var(--font-mono)" }}>
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
    <div className="columns-4 gap-4">
      {ads.map((ad) => (
        <div key={ad.id} className="break-inside-avoid mb-4">
          <AdTile ad={ad} />
        </div>
      ))}
    </div>
  );
}
