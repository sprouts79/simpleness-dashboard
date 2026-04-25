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
  invertDelta?: boolean;
}

/**
 * KPI Card — Shopify-aktig:
 *   ─ Title (normal case, font-semibold med subtle underline — section-title)
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
        "rounded-xl border bg-white px-4 py-3.5 flex flex-col",
        highlight ? "border-neutral-300 ring-1 ring-neutral-100" : "border-neutral-200"
      )}
    >
      <p className="section-title">{label}</p>

      <div className="mt-2.5 flex items-baseline gap-2 flex-wrap">
        <p
          className={clsx(
            "font-bold tabular-nums leading-none text-neutral-900",
            size === "large" ? "text-3xl" : "text-2xl"
          )}
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {value}
        </p>
        {delta !== undefined && <DeltaPill delta={delta} invert={invertDelta} />}
      </div>

      {delta !== undefined && (
        <p className="text-xs text-neutral-500 mt-1">{deltaLabel ?? "vs forrige uke"}</p>
      )}

      {status && (
        <div className="mt-auto pt-2.5">
          <StatusDot level={status.level} label={status.label} />
        </div>
      )}

      {note && !status && (
        <p className="text-sm text-neutral-600 mt-1.5 leading-snug">{note}</p>
      )}
    </div>
  );
}
