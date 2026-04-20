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
        "border-2 border-[var(--color-black)] p-4 flex flex-col gap-1 shadow-[3px_3px_0_0_rgba(9,10,8,1)]",
        highlight ? "bg-[var(--color-green-pale)]" : "bg-white"
      )}
    >
      <p className="text-xs font-medium text-[rgba(9,10,8,0.45)] uppercase tracking-wide">
        {label}
      </p>
      <p
        className={clsx(
          "font-bold tabular-nums leading-tight",
          size === "large" ? "text-3xl" : "text-2xl"
        )}
        style={{ fontFamily: "var(--font-mono)" }}
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
          <span className="font-normal text-[rgba(9,10,8,0.4)]">
            {deltaLabel ?? "vs forrige uke"}
          </span>
        </p>
      )}
      {note && (
        <p className="text-xs text-[rgba(9,10,8,0.4)] mt-0.5">{note}</p>
      )}
    </div>
  );
}
