import clsx from "clsx";

interface DeltaPillProps {
  delta: number;          // -12.4 = -12.4 %
  invert?: boolean;       // true = "lower is better" (CPA, CPM, frekvens)
  className?: string;
}

/** Shopify-style inline delta indicator: ↗ +12.4 %  or  ↘ -3.1 % */
export default function DeltaPill({ delta, invert = false, className }: DeltaPillProps) {
  const isNeutral = delta === 0;
  const isUp = delta > 0;
  const isGood = invert ? !isUp : isUp;

  const arrow = isNeutral ? "→" : isUp ? "↗" : "↘";
  const sign = delta > 0 ? "+" : "";

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
        {
          "text-green-700":   isGood && !isNeutral,
          "text-red-600":     !isGood && !isNeutral,
          "text-neutral-400": isNeutral,
        },
        className
      )}
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <span aria-hidden="true">{arrow}</span>
      <span>{sign}{delta.toFixed(1)} %</span>
    </span>
  );
}
