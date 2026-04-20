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
      {/* Main value row: big number + label beside it */}
      <div className="flex items-baseline gap-3">
        <p
          className={clsx(
            "font-bold tabular-nums leading-none",
            size === "large" ? "text-5xl" : "text-4xl"
          )}
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {value}
        </p>
        <div className="flex flex-col">
          <p className="text-base font-medium text-[rgba(9,10,8,0.7)] leading-tight">
            {label}
          </p>
          {note && (
            <p className="text-sm text-[rgba(9,10,8,0.45)] leading-tight mt-0.5">
              {note}
            </p>
          )}
        </div>
      </div>

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
