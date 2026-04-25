import clsx from "clsx";

interface DeltaPillProps {
  delta: number;          // -12.4 means -12.4 %
  invert?: boolean;       // true if "lower is better" (CPA, CPM, frequency)
  className?: string;
}

/**
 * Shopify-style inline delta indicator: ↗ +12.4 %  or  ↘ -3.1 %
 * Color-coded by direction + intent (invert flips green/red for "lower-is-better" metrics).
 */
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
          "text-[var(--color-success)]": isGood && !isNeutral,
          "text-[var(--color-error)]":   !isGood && !isNeutral,
          "text-[var(--color-fg-disabled)]": isNeutral,
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
