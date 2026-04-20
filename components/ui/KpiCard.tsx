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
        "rounded-lg border p-5 flex flex-col gap-1.5",
        highlight ? "border-[var(--color-accent)] bg-[var(--color-green-pale)]" : "border-[var(--color-border)] bg-white"
      )}
    >
      <p className="text-2xs font-semibold text-[rgba(9,10,8,0.5)] uppercase tracking-widest">
        {label}
      </p>
      <p
        className={clsx(
          "font-bold tabular-nums leading-tight",
          size === "large" ? "text-5xl" : "text-3xl"
        )}
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {value}
      </p>
      {delta !== undefined && (
        <p
          className={clsx("text-sm font-medium", {
            "delta-up": isGood,
            "delta-down": !isGood && !isNeutral,
            "delta-neutral": isNeutral,
          })}
        >
          {formatDelta(delta)}{" "}
          <span className="font-normal text-[rgba(9,10,8,0.5)]">
            {deltaLabel ?? "vs forrige uke"}
          </span>
        </p>
      )}
      {note && (
        <p className="text-xs text-[rgba(9,10,8,0.5)] mt-1">{note}</p>
      )}
    </div>
  );
}
