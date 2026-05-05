"use client";

import { ClientForecastConfig, Quarter, QUARTER_LABEL, fmtNok } from "@/lib/forecast-mock";

/**
 * Mål for valgt kvartal — kort og kompakt over hovedinnholdet.
 * Sikrer at budsjett-konteksten alltid er synlig.
 */
export default function QuarterTargets({
  cfg,
  quarter,
}: {
  cfg: ClientForecastConfig;
  quarter: Quarter;
}) {
  const summary = cfg.quarters[quarter];
  const cacTarget = cfg.monthlyBudget.targetCac ?? 0;
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 flex flex-wrap items-baseline gap-x-6 gap-y-1.5">
      <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
        {QUARTER_LABEL[quarter]} — mål
      </div>
      <Target label="Spend"        value={`${fmtNok(summary.spendBudget, { compact: true })} kr`} />
      <Target label={cfg.kundetype === "abonnement" ? "Nye abo" : "Nye kunder"} value={fmtNok(summary.nyeBudget)} />
      {cacTarget > 0 && (
        <Target label="CAC target" value={`${fmtNok(cacTarget)} kr`} />
      )}
    </div>
  );
}

function Target({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[11px] text-neutral-500">{label}</span>
      <span
        className="text-sm font-semibold tabular-nums text-neutral-900"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {value}
      </span>
    </div>
  );
}
