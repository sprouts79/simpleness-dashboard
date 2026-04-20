import clsx from "clsx";

interface KpiCardProps {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  note?: string;
  size?: "default" | "large";
  highlight?: boolean;
  invertDelta?: boolean;
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
        "rounded-lg border border-[var(--color-border)] p-5 flex flex-col gap-1.5",
        highlight ? "bg-[var(--color-gray-50)]" : "bg-white"
      )}
    >
      <p className="text-xs font-medium text-[var(--color-gray-500)] tracking-wide">
        {label}
      </p>
      <p
        className={clsx(
          "font-semibold tabular-nums leading-tight tracking-tight",
          size === "large" ? "text-3xl" : "text-2xl"
        )}
      >
        {value}
      </p>
      {delta !== undefined && (
        <p
          className={clsx("text-xs font-medium", {
            "delta-up": isGood,
            "delta-down": !isGood && !isNeutral,
            "delta-neutral": isNeutral,
          })}
        >
          {formatDelta(delta)}{" "}
          <span className="font-normal text-[var(--color-gray-400)]">
            {deltaLabel ?? "vs forrige uke"}
          </span>
        </p>
      )}
      {note && (
        <p className="text-xs text-[var(--color-gray-400)] mt-0.5">{note}</p>
      )}
    </div>
  );
}
