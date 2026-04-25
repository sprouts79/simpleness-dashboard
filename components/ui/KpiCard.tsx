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
  size?: "default" | "large";
  highlight?: boolean;
  invertDelta?: boolean; // lower is better (CPA, CPM, Frequency)
}

/**
 * KPI Card — Shopify-aktig oppsett:
 *   ─ Tittel (underline, dempet)
 *   ─ Stort sort tall + inline delta-pil
 *   ─ Optional status-prikk eller note nederst
 */
export default function KpiCard({
  label,
  value,
  delta,
  deltaLabel,
  note,
  status,
  size = "default",
  highlight = false,
  invertDelta = false,
}: KpiCardProps) {
  return (
    <div
      className={clsx(
        "rounded-xl border bg-white px-5 py-4 min-h-[140px] flex flex-col transition-colors",
        highlight
          ? "border-[var(--color-fg)]/15 ring-1 ring-[var(--color-fg)]/5"
          : "border-[var(--color-border)]"
      )}
    >
      {/* Eyebrow tittel (Shopify-aktig underline) */}
      <p className="section-title">{label}</p>

      {/* Big number + inline delta — på samme linje, Shopify-pattern */}
      <div className="mt-3 flex items-baseline gap-2 flex-wrap">
        <p
          className={clsx(
            "font-bold tabular-nums leading-none text-[var(--color-fg)]",
            size === "large" ? "text-4xl" : "text-3xl"
          )}
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {value}
        </p>
        {delta !== undefined && (
          <DeltaPill delta={delta} invert={invertDelta} />
        )}
      </div>

      {/* Delta context-label (sub-line) */}
      {delta !== undefined && deltaLabel && (
        <p className="text-xs text-[var(--color-fg-subtle)] mt-1.5">
          {deltaLabel}
        </p>
      )}
      {delta !== undefined && !deltaLabel && (
        <p className="text-xs text-[var(--color-fg-subtle)] mt-1.5">
          vs forrige uke
        </p>
      )}

      {/* Status — bottom-aligned */}
      {status && (
        <div className="mt-auto pt-3">
          <StatusDot level={status.level} label={status.label} />
        </div>
      )}

      {/* Note (når ingen status) */}
      {note && !status && (
        <p className="text-sm text-[var(--color-fg-muted)] mt-2 leading-snug">
          {note}
        </p>
      )}
    </div>
  );
}
