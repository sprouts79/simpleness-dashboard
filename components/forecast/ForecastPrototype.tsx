"use client";

import { useState } from "react";
import clsx from "clsx";
import { useSearchParams } from "next/navigation";
import {
  FORECAST_CONFIG,
  Quarter,
  QUARTER_MONTHS,
  monthLabel,
  daysInMonth,
  fmtNok,
  ClientForecastConfig,
  computeQuarterTotals,
} from "@/lib/forecast-mock";
import YearQuarterStrip, { QuarterTotals } from "./YearQuarterStrip";
import DeltaPill from "@/components/ui/DeltaPill";

export default function ForecastPrototype({ clientId }: { clientId: string }) {
  const cfg = FORECAST_CONFIG[clientId];
  const searchParams = useSearchParams();

  if (!cfg) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-8 max-w-2xl">
        <p className="text-sm text-neutral-600">
          Ingen forecast-konfig for <span className="font-medium">{clientId}</span> ennå.
          Kun Kokkeløren er satt opp som demo.
        </p>
      </div>
    );
  }

  const qParam = searchParams.get("q");
  const quarter: Quarter = qParam && ["1","2","3","4"].includes(qParam) ? Number(qParam) as Quarter : 2;
  const months = QUARTER_MONTHS[quarter];

  const todayMonth = parseInt(cfg.todayDate.split("-")[1], 10);
  const todayDay = parseInt(cfg.todayDate.split("-")[2], 10);
  const actualsMap = new Map(cfg.actuals.map((a) => [a.date, a]));
  const cacTarget = cfg.monthlyBudget.targetCac ?? 0;

  // Beregn totaler for alle 4 kvartaler (vises i YearQuarterStrip)
  // Q1 er avsluttet — vi har ikke aktiviteter for det, men har faktisk-tall i config
  const q1Faktisk: QuarterTotals = {
    spendActual: cfg.quarters[1].spendActual ?? 0,
    nyeActual: cfg.quarters[1].nyeActual ?? 0,
    spendForecast: cfg.quarters[1].spendActual ?? 0,
    nyeForecast: cfg.quarters[1].nyeActual ?? 0,
  };
  const allTotals: Record<Quarter, QuarterTotals> = {
    1: q1Faktisk,
    2: computeQuarterTotals(cfg, 2),
    3: computeQuarterTotals(cfg, 3),
    4: computeQuarterTotals(cfg, 4),
  };

  const qBudget = cfg.quarters[quarter];
  const isFutureQuarter = qBudget.status === "planned";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Forecast og rapport</h1>
      </div>

      <YearQuarterStrip
        activeQuarter={quarter}
        quarters={cfg.quarters}
        totals={allTotals}
      />

      {/* Kvartalssammendrag — akkumulert for valgt kvartal, horisontal banner */}
      {!isFutureQuarter && (() => {
        const qTotals = allTotals[quarter];
        const isPast = qBudget.status === "done";
        return (
          <section>
            <h2 className="section-title mb-3">Q{quarter} {cfg.year} — akkumulert</h2>
            <QuarterBanner
              spendBudget={qBudget.spendBudget}
              spendForecast={qTotals.spendForecast}
              nyeBudget={qBudget.nyeBudget}
              nyeForecast={qTotals.nyeForecast}
              cacTarget={cacTarget}
              kundetype={cfg.kundetype}
              isPast={isPast}
            />
          </section>
        );
      })()}

      {/* Per måned: månedssammendrag + daglig kalender */}
      {!isFutureQuarter && (
        <div className="space-y-8">
          {months.map((m) => (
            <MonthBlock
              key={m}
              cfg={cfg}
              month={m}
              todayMonth={todayMonth}
              todayDay={todayDay}
              actualsMap={actualsMap}
              cacTarget={cacTarget}
            />
          ))}
        </div>
      )}

      {isFutureQuarter && (
        <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/30 p-6 text-sm text-amber-800">
          <p className="font-medium">Q{quarter} er ikke startet enda.</p>
          <p className="mt-1 text-amber-700">
            {qBudget.activitiesCount === 0
              ? "Ingen aktiviteter er planlagt — bør tas på kvartalsmøtet før Q-start."
              : `${qBudget.activitiesCount} aktiviteter satt opp. Se Aktivitetsplan for detaljer.`}
          </p>
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// Måned-blokk: månedssammendrag + daglig kalender
// --------------------------------------------------------------------------

function MonthBlock({
  cfg, month, todayMonth, todayDay, actualsMap, cacTarget,
}: {
  cfg: ClientForecastConfig;
  month: number;
  todayMonth: number;
  todayDay: number;
  actualsMap: Map<string, { date: string; spend: number; nye: number }>;
  cacTarget: number;
}) {
  const isPastMonth = month < todayMonth;
  const isCurrentMonth = month === todayMonth;
  const isFutureMonth = month > todayMonth;
  // Default: bare aktiv måned er expandert
  const [expanded, setExpanded] = useState(isCurrentMonth);

  const days = daysInMonth(cfg.year, month);
  const dailyBudgetSpend = cfg.monthlyBudget.spend / days;
  const dailyBudgetNye = cfg.monthlyBudget.nye / days;

  // Beregn månedstotaler (forecast + faktisk)
  let mSpendActual = 0, mNyeActual = 0;
  let mSpendForecast = 0, mNyeForecast = 0;
  const dayRows: { day: number; date: string; fSpend: number; fNye: number }[] = [];
  for (let day = 1; day <= days; day++) {
    const date = `${cfg.year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    let fSpend = 0, fNye = 0;
    for (const a of cfg.activities) {
      if (a.eventDate === date) { fNye += a.eventNye ?? 0; continue; }
      if (date >= a.startDate && date <= a.endDate && a.dailySpend > 0) {
        fSpend += a.dailySpend;
        if (cfg.kundetype === "abonnement" && a.forventet > 0) fNye += a.dailySpend / a.forventet;
      }
    }
    dayRows.push({ day, date, fSpend, fNye });

    const isPast = isPastMonth || (isCurrentMonth && day <= todayDay);
    const actual = actualsMap.get(date);
    if (isPast && actual) {
      mSpendActual += actual.spend;
      mNyeActual += actual.nye;
      mSpendForecast += actual.spend;
      mNyeForecast += actual.nye;
    } else {
      mSpendForecast += fSpend;
      mNyeForecast += fNye;
    }
  }

  return (
    <section>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-2 mb-3 text-left group"
      >
        <div className="flex items-center gap-2">
          <Chevron expanded={expanded} />
          <h3 className="text-sm font-semibold text-neutral-900">{monthLabel(month)} {cfg.year}</h3>
          {isCurrentMonth && (
            <span className="text-[10px] uppercase tracking-wider text-[#3b8d0a]">Aktiv</span>
          )}
        </div>
        <span className="text-xs text-neutral-400 group-hover:text-neutral-600 transition-colors">
          {expanded ? "Lukk daglig" : "Åpne daglig"}
        </span>
      </button>

      {/* Månedssammendrag — alltid synlig */}
      <div className="mb-3">
        <MonthSummaryGrid
          spendBudget={cfg.monthlyBudget.spend}
          spendForecast={mSpendForecast}
          nyeBudget={cfg.monthlyBudget.nye}
          nyeForecast={mNyeForecast}
          cacTarget={cacTarget}
          kundetype={cfg.kundetype}
          isPast={isPastMonth}
        />
      </div>

      {expanded && (
        <>
          {/* Daglig kalender — separate forecast / faktisk kolonner */}
          <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr className="text-[10px] uppercase tracking-wider text-neutral-500">
                  <th className="text-left px-3 py-2 font-semibold" rowSpan={2}>Dag</th>
                  <th className="text-right px-2 py-1 font-semibold border-l border-neutral-200" colSpan={3}>Spend</th>
                  <th className="text-right px-2 py-1 font-semibold border-l border-neutral-200" colSpan={3}>{cfg.kundetype === "abonnement" ? "Nye abo" : "Nye kunder"}</th>
                  <th className="text-right px-2 py-1 font-semibold border-l border-neutral-200" rowSpan={2}>CAC</th>
                </tr>
                <tr className="text-[10px]">
                  <ColHead label="Budsjett" bordered />
                  <ColHead label="Forecast" />
                  <ColHead label="Resultat" />
                  <ColHead label="Budsjett" bordered />
                  <ColHead label="Forecast" />
                  <ColHead label="Resultat" />
                </tr>
              </thead>
              <tbody>
                {dayRows.map((row) => {
                  const actual = actualsMap.get(row.date);
                  const isPast = isPastMonth || (isCurrentMonth && row.day <= todayDay);
                  const isToday = isCurrentMonth && row.day === todayDay;
                  const cac = actual && actual.nye > 0 ? actual.spend / actual.nye : null;
                  return (
                    <tr
                      key={row.date}
                      className={clsx(
                        "border-b border-neutral-100 last:border-0",
                        isToday && "bg-[#fff8e1]/40",
                      )}
                    >
                      <td className={clsx("px-3 py-1.5 font-medium tabular-nums", isPast ? "text-neutral-900" : "text-neutral-400")} style={{ fontFamily: "var(--font-mono)" }}>
                        {row.day}.{month}
                      </td>
                      {/* Spend */}
                      <CellBudget value={dailyBudgetSpend} format={(n) => fmtNok(n)} bordered />
                      <CellForecast value={row.fSpend} format={(n) => fmtNok(n)} />
                      <CellActual value={actual?.spend} format={(n) => fmtNok(n)} />
                      {/* Nye */}
                      <CellBudget value={dailyBudgetNye} format={(n) => n.toFixed(1)} bordered />
                      <CellForecast value={row.fNye} format={(n) => row.fNye > 0 ? n.toFixed(1) : "0"} />
                      <CellActual value={actual?.nye} format={(n) => fmtNok(n)} />
                      {/* CAC */}
                      <CellCac value={cac} budgetTarget={cacTarget} />
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={clsx(
        "w-3 h-3 text-neutral-400 transition-transform",
        expanded && "rotate-90",
      )}
      fill="none" stroke="currentColor" viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

// --------------------------------------------------------------------------
// Sub-komponenter
// --------------------------------------------------------------------------

/**
 * Mock-helper: estimert "initiell forecast" — det forecasten var ved start av perioden.
 * For prototype: enkel multiplikator. På sikt lagres dette ved kvartalsmøte og oppdateres ikke.
 */
function mockInitialForecast(currentValue: number, kind: "spend" | "nye" | "cac"): number {
  const factors = { spend: 1.10, nye: 0.95, cac: 1.05 };
  return currentValue * factors[kind];
}

/**
 * QuarterBanner — bred horisontal "highlights"-stripe for akkumulert kvartal.
 * Skiller seg visuelt fra de 3 KPI-kortene per måned.
 */
function QuarterBanner({
  spendBudget, spendForecast,
  nyeBudget, nyeForecast,
  cacTarget, kundetype, isPast,
}: {
  spendBudget: number; spendForecast: number;
  nyeBudget: number; nyeForecast: number;
  cacTarget: number;
  kundetype: "abonnement" | "ecommerce";
  isPast: boolean;
}) {
  const cacForecast = nyeForecast > 0 ? spendForecast / nyeForecast : 0;
  const nyeLabel = kundetype === "abonnement" ? "Nye abo" : "Nye kunder";
  const stageLabel = isPast ? "Resultat" : "Forecast";

  const initialSpend = mockInitialForecast(spendForecast, "spend");
  const initialNye   = mockInitialForecast(nyeForecast,   "nye");
  const initialCac   = mockInitialForecast(cacForecast,   "cac");

  return (
    <div className="rounded-xl border border-neutral-900 bg-neutral-900 text-white p-5">
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/15">
        <BannerMetric
          label="Spend"
          stageLabel={stageLabel}
          value={fmtNok(spendForecast) + " kr"}
          delta={spendBudget > 0 ? ((spendForecast - spendBudget) / spendBudget) * 100 : 0}
          budgetValue={fmtNok(spendBudget) + " kr"}
          initialDelta={initialSpend > 0 ? ((spendForecast - initialSpend) / initialSpend) * 100 : 0}
          invertDelta
        />
        <BannerMetric
          label={nyeLabel}
          stageLabel={stageLabel}
          value={fmtNok(nyeForecast)}
          delta={nyeBudget > 0 ? ((nyeForecast - nyeBudget) / nyeBudget) * 100 : 0}
          budgetValue={fmtNok(nyeBudget)}
          initialDelta={initialNye > 0 ? ((nyeForecast - initialNye) / initialNye) * 100 : 0}
        />
        <BannerMetric
          label="CAC"
          stageLabel={stageLabel}
          value={fmtNok(cacForecast) + " kr"}
          delta={cacTarget > 0 ? ((cacForecast - cacTarget) / cacTarget) * 100 : 0}
          budgetValue={fmtNok(cacTarget) + " kr"}
          initialDelta={initialCac > 0 ? ((cacForecast - initialCac) / initialCac) * 100 : 0}
          invertDelta
        />
      </div>
    </div>
  );
}

function BannerMetric({
  label, stageLabel, value, delta, budgetValue, initialDelta, invertDelta = false,
}: {
  label: string;
  stageLabel: string;
  value: string;
  delta: number;
  budgetValue: string;
  initialDelta: number;
  invertDelta?: boolean;
}) {
  const deltaTone = invertDelta
    ? (delta <= 5 ? "text-green-400" : delta > 15 ? "text-red-400" : "text-amber-300")
    : (delta >= -5 ? "text-green-400" : delta < -15 ? "text-red-400" : "text-amber-300");
  const initialTone = invertDelta
    ? (initialDelta <= 0 ? "text-green-400" : "text-amber-300")
    : (initialDelta >= 0 ? "text-green-400" : "text-amber-300");
  return (
    <div className="px-5 first:pl-0 last:pr-0 py-2 md:py-0">
      <p className="text-[11px] font-semibold text-white uppercase tracking-wider mb-2">{label}</p>
      <p className="text-xs text-white">{stageLabel}</p>
      <div className="flex items-baseline gap-2 mt-0.5">
        <p
          className="text-2xl font-bold tabular-nums leading-none text-white"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {value}
        </p>
        <span
          className={clsx("text-xs font-medium tabular-nums", deltaTone)}
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {delta >= 0 ? "↗ +" : "↘ "}{delta.toFixed(1)} %
        </span>
      </div>
      <div className="mt-3 pt-2 border-t border-white/20 space-y-0.5 text-[11px]">
        <div className="flex items-baseline justify-between">
          <span className="text-white">Budsjett</span>
          <span className="text-white font-medium tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>{budgetValue}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-white">Diff. initiell forecast</span>
          <span className={clsx("tabular-nums font-medium", initialTone)} style={{ fontFamily: "var(--font-mono)" }}>
            {initialDelta >= 0 ? "+" : ""}{initialDelta.toFixed(1)} %
          </span>
        </div>
      </div>
    </div>
  );
}

function MonthSummaryGrid({
  spendBudget, spendForecast,
  nyeBudget, nyeForecast,
  cacTarget, kundetype, isPast,
}: {
  spendBudget: number; spendForecast: number;
  nyeBudget: number; nyeForecast: number;
  cacTarget: number;
  kundetype: "abonnement" | "ecommerce";
  isPast: boolean;
}) {
  const cacForecast = nyeForecast > 0 ? spendForecast / nyeForecast : 0;
  const nyeLabel = kundetype === "abonnement" ? "Nye abo" : "Nye kunder";

  const initialSpend = mockInitialForecast(spendForecast, "spend");
  const initialNye   = mockInitialForecast(nyeForecast,   "nye");
  const initialCac   = mockInitialForecast(cacForecast,   "cac");

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <MetricCard
        label="Spend"
        isPast={isPast}
        budgetValue={fmtNok(spendBudget) + " kr"}
        value={fmtNok(spendForecast) + " kr"}
        delta={spendBudget > 0 ? ((spendForecast - spendBudget) / spendBudget) * 100 : 0}
        initialDelta={initialSpend > 0 ? ((spendForecast - initialSpend) / initialSpend) * 100 : 0}
        invertDelta
      />
      <MetricCard
        label={nyeLabel}
        isPast={isPast}
        budgetValue={fmtNok(nyeBudget)}
        value={fmtNok(nyeForecast)}
        delta={nyeBudget > 0 ? ((nyeForecast - nyeBudget) / nyeBudget) * 100 : 0}
        initialDelta={initialNye > 0 ? ((nyeForecast - initialNye) / initialNye) * 100 : 0}
      />
      <MetricCard
        label="CAC"
        isPast={isPast}
        budgetValue={fmtNok(cacTarget) + " kr"}
        value={fmtNok(cacForecast) + " kr"}
        delta={cacTarget > 0 ? ((cacForecast - cacTarget) / cacTarget) * 100 : 0}
        initialDelta={initialCac > 0 ? ((cacForecast - initialCac) / initialCac) * 100 : 0}
        invertDelta
      />
    </div>
  );
}

function MetricCard({
  label, isPast, budgetValue, value, delta, initialDelta, invertDelta = false,
}: {
  label: string;
  isPast: boolean;
  budgetValue: string;
  value: string;
  delta: number;
  initialDelta: number;
  invertDelta?: boolean;
}) {
  const stageLabel = isPast ? "Resultat" : "Forecast";
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-3">{label}</p>

      <p className="text-xs text-neutral-500">{stageLabel}</p>
      <div className="flex items-baseline gap-2 mt-0.5">
        <p
          className="text-2xl font-bold tabular-nums leading-none text-neutral-900"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {value}
        </p>
        <DeltaPill delta={delta} invert={invertDelta} />
      </div>

      <div className="mt-4 pt-3 border-t border-neutral-100 space-y-1 text-xs">
        <div className="flex items-baseline justify-between">
          <span className="text-neutral-500">Budsjett</span>
          <span
            className="text-neutral-700 tabular-nums"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {budgetValue}
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-neutral-500">Diff. initiell forecast</span>
          <DeltaPill delta={initialDelta} invert={invertDelta} />
        </div>
      </div>
    </div>
  );
}

function ColHead({
  label, bordered = false,
}: { label: string; bordered?: boolean }) {
  return (
    <th
      className={clsx(
        "text-right px-2 pb-1.5 font-normal text-neutral-500",
        bordered && "border-l border-neutral-200",
      )}
    >
      {label}
    </th>
  );
}

function CellBudget({
  value, format, bordered = false,
}: { value: number; format: (n: number) => string; bordered?: boolean }) {
  return (
    <td
      className={clsx(
        "px-2 py-1.5 text-right tabular-nums text-neutral-400",
        bordered && "border-l border-neutral-100",
      )}
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {format(value)}
    </td>
  );
}

function CellForecast({ value, format }: { value: number; format: (n: number) => string }) {
  return (
    <td className="px-2 py-1.5 text-right tabular-nums text-neutral-600" style={{ fontFamily: "var(--font-mono)" }}>
      {format(value)}
    </td>
  );
}

function CellActual({
  value, format,
}: { value: number | null | undefined; format: (n: number) => string }) {
  if (value == null || !Number.isFinite(value)) {
    return <td className="px-2 py-1.5 text-right tabular-nums text-neutral-300" style={{ fontFamily: "var(--font-mono)" }}>–</td>;
  }
  return (
    <td className="px-2 py-1.5 text-right tabular-nums text-neutral-900 font-medium" style={{ fontFamily: "var(--font-mono)" }}>
      {format(value)}
    </td>
  );
}

function CellCac({ value, budgetTarget }: { value: number | null; budgetTarget: number }) {
  if (value == null || !Number.isFinite(value)) {
    return <td className="px-2 py-1.5 text-right tabular-nums text-neutral-300 border-l border-neutral-100" style={{ fontFamily: "var(--font-mono)" }}>–</td>;
  }
  let extraColor = "";
  if (budgetTarget > 0) {
    const diff = (value - budgetTarget) / budgetTarget;
    if (diff > 0.15) extraColor = "text-red-600";
    else if (diff > 0.05) extraColor = "text-amber-700";
    else if (diff < -0.05) extraColor = "text-green-700";
  }
  return (
    <td
      className={clsx(
        "px-2 py-1.5 text-right tabular-nums font-medium border-l border-neutral-100",
        extraColor || "text-neutral-900",
      )}
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {fmtNok(value)} kr
    </td>
  );
}

