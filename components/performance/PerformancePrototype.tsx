"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PillSelect from "@/components/ui/PillSelect";
import SectionHeader from "@/components/ui/SectionHeader";
import SpendTrendChart from "@/components/charts/SpendTrendChart";
import ReachCompositionChart from "@/components/charts/ReachCompositionChart";
import {
  PerformanceKpis,
  SpendTrendPoint,
  PeriodKey,
  CompareKey,
  ReachKpis,
  ReachCompositionPoint,
} from "@/lib/types";
import clsx from "clsx";

const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: "today", label: "I går" },
  { value: "7d", label: "Siste 7 dager" },
  { value: "30d", label: "Siste 30 dager" },
  { value: "prev_month", label: "Forrige måned" },
  { value: "3m", label: "Siste 3 måneder" },
  { value: "6m", label: "Siste 6 måneder" },
  { value: "12m", label: "Siste 12 måneder" },
];

const COMPARE_OPTIONS: { value: CompareKey; label: string }[] = [
  { value: "period", label: "Forrige periode" },
  { value: "year", label: "Forrige år" },
];

/**
 * Per-kunde "north star" KPI-konfig + targets fra Vekst.
 * Hardkodet for prototype — flyttes til Vekst-config senere.
 */
type ClientConfig = {
  kundetype: "ecommerce" | "abonnement";
  andelNye: number;
  targetCac: number;
  targetMer: number;
  targetSpendMonthly: number; // forventet spend per måned (sesong-snitt)
  // Demo-overrides for prototype (når reell data er tynn). Brukes hvis satt.
  demoSpend?: number;
  demoNewCustomers?: number;
};

const CLIENT_CONFIG: Record<string, ClientConfig> = {
  kokkeloren: {
    kundetype: "abonnement",
    andelNye: 1.00,         // én konvertering = én ny abonnent
    targetCac: 1100,
    targetMer: 5.0,
    targetSpendMonthly: 350_000 / 12,
    demoSpend: 132_000,
    demoNewCustomers: 115,  // CAC ~1148 kr — så vidt over target 1100
  },
  myyk: {
    kundetype: "ecommerce",
    andelNye: 0.50,
    targetCac: 387,
    targetMer: 6.7,
    targetSpendMonthly: 4_158_000 / 12,
  },
  farfar: {
    kundetype: "ecommerce",
    andelNye: 0.40,
    targetCac: 320,
    targetMer: 3.5,
    targetSpendMonthly: 200_000,
  },
};

function fmtNok(n: number, opts: { compact?: boolean } = {}): string {
  if (!Number.isFinite(n)) return "–";
  if (opts.compact) {
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M`;
    if (Math.abs(n) >= 1_000) return `${Math.round(n / 1_000)} k`;
  }
  return Math.round(n).toLocaleString("nb-NO");
}

interface Props {
  clientId: string;
  kpis: PerformanceKpis;
  trend: SpendTrendPoint[];
  reachKpis: ReachKpis | null;
  reachComposition: ReachCompositionPoint[];
  period: PeriodKey;
  compare: CompareKey;
}

export default function PerformancePrototype({
  clientId,
  kpis,
  trend,
  reachKpis,
  reachComposition,
  period,
  compare,
}: Props) {
  const router = useRouter();
  const cfg = CLIENT_CONFIG[clientId] ?? CLIENT_CONFIG["myyk"]; // fallback

  // Reach-lookback (UI-only for nå — kobles til data senere)
  const [lookback, setLookback] = useState<"3mndr" | "6mndr">("3mndr");

  const updateParam = (key: string, value: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set(key, value);
    router.push(url.pathname + url.search);
  };

  // --- Beregn north-star KPIer (med demo-overrides hvis satt) ---
  const spend = cfg.demoSpend ?? kpis.spend;

  const orders = kpis.cpa > 0 ? kpis.spend / kpis.cpa : 0;
  const newCustomers = cfg.demoNewCustomers ?? orders * cfg.andelNye;

  const cac = newCustomers > 0 ? spend / newCustomers : 0;

  // Reach 6 mndr — alltid, uavhengig av valgt periode
  const reach6mnd = reachComposition.slice(-6);

  return (
    <div className="space-y-8">
      {/* Periode-velgere */}
      <div className="flex items-center gap-2">
        <PillSelect
          value={period}
          options={PERIOD_OPTIONS}
          onChange={(v) => updateParam("period", v)}
        />
        <PillSelect
          value={compare}
          options={COMPARE_OPTIONS}
          onChange={(v) => updateParam("compare", v)}
        />
      </div>

      {/* North-star KPIer */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <NorthStarCard
            label="Spend"
            value={fmtNok(spend) + " kr"}
            previousDelta={18.4}
            previousLabel={kpis.compareLabel}
          />
          <NorthStarCard
            label="Antall nye kunder"
            value={fmtNok(newCustomers)}
            previousDelta={-7.2}
            previousLabel={kpis.compareLabel}
          />
          <NorthStarCard
            label="CAC"
            value={fmtNok(cac) + " kr"}
            target={cfg.targetCac}
            actual={cac}
            invertTarget
            previousDelta={-5.1}
            previousLabel={kpis.compareLabel}
            invertPrevious
          />
        </div>
      </section>

      {/* Spend / ROAS-graf */}
      <section>
        <SectionHeader title="Spend og ROAS" />
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div style={{ height: 320 }}>
            <SpendTrendChart data={trend} />
          </div>
        </div>
      </section>

      {/* Reach */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="section-title">Rekkevidde</h2>
          <LookbackToggle value={lookback} onChange={setLookback} />
        </div>
        {reachKpis && (() => {
          const nyePctSnitt = reachKpis.avgNetNewPct;
          const sisteMaaned = reachComposition[reachComposition.length - 1];
          const nyePctSiste = sisteMaaned?.netNewPct ?? 0;

          const statusFor = (pct: number) =>
            pct >= 25
              ? { level: "good"    as const, label: "Frisk målgruppe" }
              : pct >= 15
              ? { level: "warning" as const, label: "Moderat metning" }
              : { level: "critical" as const, label: "Høy metning" };

          const sSnitt = statusFor(nyePctSnitt);
          const sSiste = statusFor(nyePctSiste);

          return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <SmallKpi label="Total rekkevidde"     value={fmtNok(reachKpis.totalRollingReach, { compact: true })} />
              <SmallKpi label="% nye siste måned"    value={`${nyePctSiste.toFixed(1)}%`} status={sSiste.level} statusLabel={sSiste.label} />
              <SmallKpi label="Snitt nye per måned"  value={fmtNok(reachKpis.avgNetNewReach, { compact: true })} />
              <SmallKpi label="Snitt nye %"          value={`${nyePctSnitt.toFixed(1)}%`} status={sSnitt.level} statusLabel={sSnitt.label} />
            </div>
          );
        })()}
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div style={{ height: 280 }}>
            <ReachCompositionChart data={reach6mnd} />
          </div>
        </div>
      </section>

      {/* Prototype-fotnote */}
      <div className="text-xs text-neutral-500 max-w-2xl">
        Prototype-visning. Targets hardkodet per kunde — flyttes til Vekst-konfig senere. Reach-grafen viser alltid siste 6 måneder uavhengig av periodevalg.
      </div>
    </div>
  );
}

// ─── Sub-komponenter ─────────────────────────────────────────────────────────

function NorthStarCard({
  label,
  value,
  hint,
  previousDelta,
  previousLabel,
  invertPrevious = false,
  target,
  targetUnit,
  actual,
  invertTarget = false,
}: {
  label: string;
  value: string;
  hint?: string;
  previousDelta?: number;
  previousLabel?: string;
  invertPrevious?: boolean;
  target?: number;
  targetUnit?: string;
  actual?: number;
  invertTarget?: boolean;
}) {
  const targetDelta =
    target !== undefined && actual !== undefined && target > 0
      ? ((actual - target) / target) * 100
      : undefined;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <p className="text-sm text-neutral-600">{label}</p>
      <p
        className="text-3xl font-bold tabular-nums leading-none mt-2 text-neutral-900"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {value}
      </p>
      {hint && <p className="text-xs text-neutral-500 mt-2">{hint}</p>}

      {(targetDelta !== undefined || previousDelta !== undefined) && (
        <div className="mt-3 pt-3 border-t border-neutral-100 space-y-1.5">
          {targetDelta !== undefined && (
            <DeltaLine
              delta={targetDelta}
              invert={invertTarget}
              label="vs mål"
              emphasis
            />
          )}
          {previousDelta !== undefined && (
            <DeltaLine
              delta={previousDelta}
              invert={invertPrevious}
              label={previousLabel ?? "vs forrige"}
            />
          )}
        </div>
      )}
    </div>
  );
}

function DeltaLine({
  delta,
  invert = false,
  label,
  emphasis = false,
}: {
  delta: number;
  invert?: boolean;
  label: string;
  emphasis?: boolean;
}) {
  const abs = Math.abs(delta);
  const isNeutral = abs < 0.5;
  const isUp = delta > 0;
  const isGood = invert ? !isUp : isUp;

  const color = isNeutral
    ? "text-neutral-400"
    : isGood
      ? "text-green-700"
      : "text-red-600";

  const arrow = isNeutral ? "→" : isUp ? "↗" : "↘";
  const sign = delta > 0 ? "+" : "";

  return (
    <div className="flex items-baseline gap-2 text-xs">
      <span
        className={clsx("inline-flex items-center gap-0.5 font-medium tabular-nums w-16 flex-shrink-0", color)}
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <span aria-hidden="true">{arrow}</span>
        <span>{sign}{delta.toFixed(1)}%</span>
      </span>
      <span className={clsx("text-neutral-500 truncate", emphasis && "text-neutral-700")}>{label}</span>
    </div>
  );
}

function LookbackToggle({
  value,
  onChange,
}: {
  value: "3mndr" | "6mndr";
  onChange: (v: "3mndr" | "6mndr") => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-neutral-500">Lookback</span>
      <div className="flex items-center gap-0.5 p-0.5 bg-neutral-100 rounded-md">
        {(["3mndr", "6mndr"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            className={clsx(
              "px-2 py-0.5 rounded text-[11px] font-medium transition-colors",
              value === m
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-900"
            )}
          >
            {m === "3mndr" ? "3 mndr" : "6 mndr"}
          </button>
        ))}
      </div>
    </div>
  );
}

function SmallKpi({
  label,
  value,
  status,
  statusLabel,
}: {
  label: string;
  value: string;
  status?: "good" | "warning" | "critical";
  statusLabel?: string;
}) {
  const dotColor =
    status === "good" ? "bg-[#41bd0e]"
    : status === "warning" ? "bg-amber-400"
    : status === "critical" ? "bg-red-500"
    : null;
  const textColor =
    status === "good" ? "text-green-700"
    : status === "warning" ? "text-amber-700"
    : status === "critical" ? "text-red-600"
    : "text-neutral-500";
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3.5">
      <p className="text-xs text-neutral-600">{label}</p>
      <p
        className="text-xl font-bold tabular-nums leading-none mt-1.5 text-neutral-900"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {value}
      </p>
      {dotColor && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className={clsx("w-1.5 h-1.5 rounded-full flex-shrink-0", dotColor)} />
          <span className={clsx("text-[11px]", textColor)}>{statusLabel ?? ""}</span>
        </div>
      )}
    </div>
  );
}
