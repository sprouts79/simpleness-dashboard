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
    <div className="card p-5 flex flex-col gap-2">
      <p className="small-caps">
        {label}
      </p>
      <p
        className={clsx(
          "font-display font-semibold tabular-nums leading-tight tracking-tight text-navy",
          size === "large" ? "text-4xl" : "text-3xl"
        )}
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
          <span className="font-normal text-gray-400">
            {deltaLabel ?? "vs forrige uke"}
          </span>
        </p>
      )}
      {note && (
        <p className="text-sm text-gray-500 mt-1">{note}</p>
      )}
    </div>
  );
}
