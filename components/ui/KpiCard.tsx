import clsx from "clsx";
import DeltaPill from "./DeltaPill";
import StatusDot from "./StatusDot";

type StatusLevel = "good" | "warning" | "critical";

interface KpiCardProps {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  note?: string;
  status?: { level: StatusLevel; label: string; description?: string };
  /** @deprecated — alle KPIer bruker samme size i Shopify-stil. Beholdt for API-kompat. */
  size?: "default" | "large";
  highlight?: boolean;
  invertDelta?: boolean;
}

/**
 * KPI Card — Shopify-stil:
 *   ─ Title (normal case, font-semibold med subtle underline)
 *   ─ Stort tall (text-2xl) + inline delta-pil
 *   ─ Optional sub-info (delta-label, status, note)
 *
 * Naturlig høyde — strekker seg ikke unødig. Grid-container må sette
 * items-start for å unngå stretch.
 */
export default function KpiCard({
  label,
  value,
  delta,
  deltaLabel,
  note,
  status,
  highlight = false,
  invertDelta = false,
}: KpiCardProps) {
  return (
    <div
      className={clsx(
        "rounded-xl border bg-white p-4",
        highlight ? "border-neutral-300 ring-1 ring-neutral-100" : "border-neutral-200"
      )}
    >
      <p className="section-title">{label}</p>

      <div className="mt-2 flex items-baseline gap-2 flex-wrap">
        <p
          className="text-2xl font-bold tabular-nums leading-none text-neutral-900"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {value}
        </p>
        {delta !== undefined && <DeltaPill delta={delta} invert={invertDelta} />}
      </div>

      {delta !== undefined && deltaLabel && (
        <p className="text-xs text-neutral-500 mt-1">{deltaLabel}</p>
      )}

      {status && (
        <div className="mt-2">
          <StatusDot level={status.level} label={status.label} />
        </div>
      )}

      {note && !status && (
        <p className="text-sm text-neutral-600 mt-1.5 leading-snug">{note}</p>
      )}
    </div>
  );
}
