import clsx from "clsx";

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
  status,
  size = "default",
  highlight = false,
  invertDelta = false,
}: KpiCardProps) {
  const isNeutral = delta === undefined || delta === 0;
  const isGood = invertDelta ? (delta ?? 0) < 0 : (delta ?? 0) > 0;

  return (
    <div
      className={clsx(
        "rounded-2xl px-6 py-5 min-h-[140px] flex flex-col",
        highlight 
          ? "bg-white border-2 border-[var(--color-black)]" 
          : "bg-[var(--color-surface)]"
      )}
    >
      {/* Label */}
      <span className="text-sm font-medium text-[rgba(9,10,8,0.5)] mb-2">
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

      {/* Status badge if present */}
      {status && (
        <div className="mt-auto pt-3">
          <span
            className={clsx(
              "inline-flex items-center gap-1.5 text-xs",
              {
                "text-[#3d8a12]": status.level === "good",
                "text-[#9a7010]": status.level === "warning",
                "text-[#9a4c4c]": status.level === "critical",
              }
            )}
          >
            <span
              className={clsx("w-1.5 h-1.5 rounded-full", {
                "bg-[#3d8a12]": status.level === "good",
                "bg-[#b47814]": status.level === "warning",
                "bg-[#b45c5c]": status.level === "critical",
              })}
            />
            {status.label}
          </span>
        </div>
      )}

      {/* Note if present (simple text) */}
      {note && !status && (
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
