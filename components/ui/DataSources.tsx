type DataSource = "meta" | "google" | "snap" | "tiktok";

const SOURCE_META: Record<DataSource, { label: string; color: string }> = {
  meta:   { label: "Meta Ads",    color: "#1877F2" }, // facebook-blå
  google: { label: "Google Ads",  color: "#4285F4" }, // google-blå
  snap:   { label: "Snap Ads",    color: "#FFFC00" }, // snap-gul
  tiktok: { label: "TikTok Ads",  color: "#FE2C55" }, // tiktok-rød
};

interface DataSourcesProps {
  sources: DataSource[];
  className?: string;
}

/**
 * Indikator for hvilke datakilder en side bruker. Subtil — prikk per kilde
 * i kildens signaturfarge + label. Skalerer til flere kilder ved siden av
 * hverandre (Meta + Google + Snap når de kommer på).
 */
export default function DataSources({ sources, className = "" }: DataSourcesProps) {
  if (sources.length === 0) return null;

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <span className="text-xs text-neutral-500">Datakilder</span>
      <div className="inline-flex items-center gap-2">
        {sources.map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-700"
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: SOURCE_META[s].color }}
            />
            {SOURCE_META[s].label}
          </span>
        ))}
      </div>
    </div>
  );
}
