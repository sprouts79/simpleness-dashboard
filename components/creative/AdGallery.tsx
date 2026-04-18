"use client";

import { useState, useEffect } from "react";
import { Ad } from "@/lib/types";

// ─── Per-card modal ───────────────────────────────────────────────────────────

function Modal({ ad, onClose }: { ad: Ad; onClose: () => void }) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch video source URL once when modal opens (video ads only)
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
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.8)" }}
      onClick={onClose}
    >
      <div
        style={{ position: "relative", width: "min(480px, calc(100vw - 32px))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 12, right: 12, zIndex: 10, width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.55)", border: "none", color: "#fff", cursor: "pointer", fontSize: 14, lineHeight: 1 }}
        >
          ✕
        </button>
        {videoUrl ? (
          <video
            src={videoUrl}
            autoPlay
            controls
            playsInline
            style={{ width: "100%", height: "auto", display: "block", borderRadius: 16 }}
          />
        ) : (
          <img
            src={ad.thumbnailUrl}
            alt={ad.name}
            style={{ width: "100%", height: "auto", display: "block", borderRadius: 16 }}
          />
        )}
        {loading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 16, background: "rgba(0,0,0,0.3)" }}>
            <span style={{ color: "#fff", fontSize: 12 }}>Laster video…</span>
          </div>
        )}
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
        className="rounded-xl border border-[var(--color-border)] bg-white cursor-pointer hover:border-[var(--color-link)] transition-colors"
        style={{ overflow: "hidden" }}
        onClick={() => setOpen(true)}
      >
        {/* Fixed 9:16 container — image fills without distortion */}
        <div style={{ position: "relative", aspectRatio: "9/16", background: "#f0f0ee", overflow: "hidden" }}>
          {ad.thumbnailUrl && !imgError ? (
            <img
              src={ad.thumbnailUrl}
              alt={ad.name}
              onError={() => setImgError(true)}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 28, opacity: 0.35 }}>{ad.format === "video" ? "▶" : "▣"}</span>
            </div>
          )}
        </div>

        {/* Minimal metrics */}
        <div style={{ padding: "10px 12px" }}>
          <p style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.3, marginBottom: 6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {ad.name}
          </p>
          <div style={{ display: "flex", gap: 10, fontSize: 11, fontFamily: "var(--font-mono)", color: "rgba(9,10,8,0.45)" }}>
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
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
      {ads.map((ad) => (
        <AdTile key={ad.id} ad={ad} />
      ))}
    </div>
  );
}
