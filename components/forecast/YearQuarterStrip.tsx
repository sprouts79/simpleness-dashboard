"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { Quarter, QuarterSummary } from "@/lib/forecast-mock";

export interface QuarterTotals {
  spendActual: number;
  nyeActual: number;
  spendForecast: number;
  nyeForecast: number;
}

/**
 * Årsoversikt — fire kompakte status-kort. Klikk for å bytte fokus.
 * Detaljer for valgt kvartal vises i akkumulert-seksjonen under.
 */
export default function YearQuarterStrip({
  activeQuarter,
  quarters,
}: {
  activeQuarter: Quarter;
  quarters: Record<Quarter, QuarterSummary>;
  /** Beholdes for kompatibilitet — ikke brukt visuelt nå. */
  totals?: Record<Quarter, QuarterTotals>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setQuarter = (q: Quarter) => {
    const params = new URLSearchParams(searchParams);
    params.set("q", String(q));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      {([1, 2, 3, 4] as Quarter[]).map((q) => (
        <QuarterCard
          key={q}
          quarter={q}
          summary={quarters[q]}
          isActive={q === activeQuarter}
          onClick={() => setQuarter(q)}
        />
      ))}
    </div>
  );
}

function QuarterCard({
  quarter, summary, isActive, onClick,
}: {
  quarter: Quarter;
  summary: QuarterSummary;
  isActive: boolean;
  onClick: () => void;
}) {
  const Q_LABEL: Record<Quarter, string> = { 1: "Q1", 2: "Q2", 3: "Q3", 4: "Q4" };
  const STATE_LABEL = { done: "Avsluttet", active: "Aktiv", planned: "Planlagt" } as const;
  const isEmpty = summary.status === "planned" && summary.activitiesCount === 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "rounded-xl border bg-white px-4 py-3 text-left transition-colors flex items-center justify-between gap-2",
        isActive
          ? "border-neutral-900 ring-1 ring-neutral-900"
          : "border-neutral-200 hover:border-neutral-300",
      )}
    >
      <span
        className="text-sm font-bold text-neutral-900 tabular-nums"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {Q_LABEL[quarter]}
      </span>
      {isEmpty ? (
        <span className="text-[10px] text-amber-700">Må planlegges</span>
      ) : (
        <StateBadge state={summary.status} label={STATE_LABEL[summary.status]} />
      )}
    </button>
  );
}

function StateBadge({ state, label }: { state: "done" | "active" | "planned"; label: string }) {
  const cls =
    state === "done"
      ? "bg-neutral-100 text-neutral-600 border-neutral-200"
      : state === "active"
        ? "bg-[#dff7cc] text-[#3b8d0a] border-[#41bd0e]/30"
        : "bg-amber-50 text-amber-700 border-amber-200";
  return (
    <span className={clsx("text-[10px] font-medium px-1.5 py-0.5 rounded border whitespace-nowrap", cls)}>
      {label}
    </span>
  );
}
