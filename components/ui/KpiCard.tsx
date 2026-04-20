import clsx from "clsx";

interface KpiCardProps {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  note?: string;
  size?: "default" | "large";
  highlight?: boolean;
  invertDelta?: boolean; // lower is better (CPA, CPMn, Frequency)
}

function formatDelta(delta: number) {
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}%`;
}

export default function KpiCard({
  label,
  value,
  delta,
  deltaLabel,
  note,
  size = "default",
  highlight = false,
  invertDelta = false,
}: KpiCardProps) {
  const isNeutral = delta === undefined || delta === 0;
  const isGood = invertDelta ? (delta ?? 0) < 0 : (delta ?? 0) > 0;

  return (
    <div
      className={clsx(
        "rounded-2xl px-6 py-5",
        highlight 
          ? "bg-[var(--color-green-pale)]" 
          : "bg-[var(--color-surface)]"
      )}
    >
      {/* Badge label */}
      <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-white text-[rgba(9,10,8,0.6)] mb-3 shadow-sm">
        {label}
      </span>

      {/* Big number */}
      <p
        className={clsx(
          "font-bold tabular-nums leading-none",
          size === "large" ? "text-5xl" : "text-4xl"
        )}
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {value}
      </p>

      {/* Note if present */}
      {note && (
        <p className="text-sm text-[rgba(9,10,8,0.45)] mt-2">
          {note}
        </p>
      )}

      {/* Delta row */}
      {delta !== undefined && (
        <p
          className={clsx("text-sm font-medium mt-3", {
            "delta-up": isGood,
            "delta-down": !isGood && !isNeutral,
            "delta-neutral": isNeutral,
          })}
        >
          {formatDelta(delta)}{" "}
          <span className="font-normal text-[rgba(9,10,8,0.45)]">
            {deltaLabel ?? "vs forrige uke"}
          </span>
        </p>
      )}
    </div>
  );
}
