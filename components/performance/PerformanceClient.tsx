"use client";

import { useRouter } from "next/navigation";
import KpiCard from "@/components/ui/KpiCard";
import SectionHeader from "@/components/ui/SectionHeader";
import SpendTrendChart from "@/components/charts/SpendTrendChart";
import InfoBox from "@/components/ui/InfoBox";
import { PerformanceKpis, SpendTrendPoint, Campaign, PeriodKey, CompareKey } from "@/lib/types";
import clsx from "clsx";
import { useState } from "react";

const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: "today", label: "I går" },
  { value: "7d", label: "7 dager" },
  { value: "30d", label: "30 dager" },
  { value: "prev_month", label: "Forrige mnd" },
  { value: "3m", label: "3 mnd" },
  { value: "6m", label: "6 mnd" },
  { value: "12m", label: "12 mnd" },
];

const COMPARE_OPTIONS: { value: CompareKey; label: string }[] = [
  { value: "period", label: "Forrige periode" },
  { value: "year", label: "Forrige år" },
];

function formatNok(n: number) {
  if (n >= 1000000) return `NOK ${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `NOK ${Math.round(n / 1000)}k`;
  return `NOK ${Math.round(n)}`;
}

function CampaignRow({ campaign, depth = 0 }: { campaign: Campaign; depth?: number }) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = campaign.adSets && campaign.adSets.length > 0;

  return (
    <>
      <tr className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors">
        <td className="px-5 py-3">
          <div className="flex items-center gap-2" style={{ paddingLeft: depth * 20 }}>
            {hasChildren && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-[rgba(9,10,8,0.35)] hover:text-[var(--color-black)] text-xs w-4"
              >
                {expanded ? "▾" : "▸"}
              </button>
            )}
            {!hasChildren && <span className="w-4" />}
            <span className={clsx("text-sm", depth === 0 ? "font-medium" : "text-[rgba(9,10,8,0.7)]")}>
              {campaign.name}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-right" style={{ fontFamily: "var(--font-mono)" }}>
          {formatNok(campaign.spend)}
        </td>
        <td className="px-4 py-3 text-right" style={{ fontFamily: "var(--font-mono)" }}>
          {campaign.roas.toFixed(1)}×
        </td>
        <td className="px-4 py-3 text-right" style={{ fontFamily: "var(--font-mono)" }}>
          {Math.round(campaign.cpa)} kr
        </td>
        <td className="px-4 py-3 text-right" style={{ fontFamily: "var(--font-mono)" }}>
          {Math.round(campaign.cpm)} kr
        </td>
        <td className="px-4 py-3 text-right" style={{ fontFamily: "var(--font-mono)" }}>
          {campaign.frequency.toFixed(1)}
        </td>
        <td className="px-4 py-3 text-right" style={{ fontFamily: "var(--font-mono)" }}>
          {campaign.ctr.toFixed(1)}%
        </td>
        <td className="px-4 py-3 text-right text-sm" style={{ fontFamily: "var(--font-mono)" }}>
          {campaign.reach >= 1000 ? `${Math.round(campaign.reach / 1000)}K` : campaign.reach}
        </td>
      </tr>
      {expanded &&
        campaign.adSets?.map((adSet) => (
          <CampaignRow
            key={adSet.id}
            campaign={{ ...adSet, ctr: 1.2, reach: adSet.reach, adSets: undefined }}
            depth={depth + 1}
          />
        ))}
    </>
  );
}

export default function PerformanceClient({
  kpis,
  trend,
  campaigns,
  period,
  compare,
}: {
  kpis: PerformanceKpis;
  trend: SpendTrendPoint[];
  campaigns: Campaign[];
  period: PeriodKey;
  compare: CompareKey;
}) {
  const router = useRouter();

  function navigate(newPeriod: PeriodKey, newCompare: CompareKey) {
    router.push(`?period=${newPeriod}&compare=${newCompare}`);
  }

  const deltaLabel = kpis.compareLabel;

  return (
    <div className="space-y-8">
      {/* Period selector + compare toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Period */}
        <div className="flex bg-[var(--color-surface)] rounded-lg p-1 gap-1">
          {PERIOD_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => navigate(value, compare)}
              className={clsx(
                "text-xs font-semibold px-3 py-1.5 rounded-md transition-colors whitespace-nowrap",
                period === value
                  ? "bg-white text-[var(--color-black)] shadow-sm"
                  : "text-[rgba(9,10,8,0.45)] hover:text-[var(--color-black)]"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Compare */}
        <div className="flex bg-[var(--color-surface)] rounded-lg p-1 gap-1">
          {COMPARE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => navigate(period, value)}
              className={clsx(
                "text-xs font-semibold px-3 py-1.5 rounded-md transition-colors whitespace-nowrap",
                compare === value
                  ? "bg-white text-[var(--color-black)] shadow-sm"
                  : "text-[rgba(9,10,8,0.45)] hover:text-[var(--color-black)]"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPIs */}
      <div>
        <SectionHeader title="Nøkkeltall" subtitle={kpis.periodLabel} />
        <div className="grid grid-cols-3 gap-3 mb-3">
          <KpiCard
            label="Spend"
            value={formatNok(kpis.spend)}
            delta={kpis.spendDelta}
            deltaLabel={deltaLabel}
            size="large"
          />
          <KpiCard
            label="ROAS"
            value={`${kpis.roas.toFixed(1)}×`}
            delta={kpis.roasDelta}
            deltaLabel={deltaLabel}
            size="large"
          />
          <KpiCard
            label="CPA"
            value={`${Math.round(kpis.cpa)} kr`}
            delta={kpis.cpaDelta}
            deltaLabel={deltaLabel}
            size="large"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <KpiCard
            label="CPM"
            value={`${Math.round(kpis.cpm)} kr`}
            delta={kpis.cpmDelta}
            deltaLabel={deltaLabel}
          />
          <KpiCard
            label="Frekvens"
            value={kpis.frequency.toFixed(1)}
            delta={kpis.frequencyDelta}
            note={kpis.frequency > 8 ? "⚠ For høy — audience fatigue" : kpis.frequency > 6 ? "Moderat" : "Frisk"}
          />
          <KpiCard
            label="CTR (Link)"
            value={`${kpis.ctr.toFixed(1)}%`}
            delta={kpis.ctrDelta}
          />
        </div>
      </div>

      {/* Trend chart */}
      <div>
        <SectionHeader title="Spend & ROAS — trend" subtitle={kpis.periodLabel} />
        <div className="rounded-xl border border-[var(--color-border)] p-4 bg-white">
          <SpendTrendChart data={trend} days={365} />
          <div className="flex gap-6 mt-3 text-xs text-[rgba(9,10,8,0.4)]">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2.5 rounded-sm bg-[#e8e8e6] inline-block" />
              Spend (NOK)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-[var(--color-link)] inline-block" />
              ROAS
            </span>
          </div>
        </div>
      </div>

      {/* Campaign table */}
      <div>
        <SectionHeader
          title="Kampanjer"
          subtitle="Klikk ▸ for å se ad sets"
        />
        <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                {["Kampanje", "Spend", "ROAS", "CPA", "CPM", "Freq.", "CTR", "Reach"].map((h) => (
                  <th
                    key={h}
                    className={clsx(
                      "py-3 text-xs font-semibold uppercase tracking-widest text-[rgba(9,10,8,0.45)]",
                      h === "Kampanje" ? "text-left px-5" : "text-right px-4"
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <CampaignRow key={c.id} campaign={c} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hvordan lese denne rapporten */}
      <InfoBox>
        <p className="font-semibold mb-1">Hvordan lese denne rapporten</p>
        <p className="mb-2">
          Nøkkeltallene viser perioden du har valgt, med delta (pil) som forteller om det er bedre eller verre enn sammenligningsperioden.
          <strong> ROAS</strong> (Return on Ad Spend) viser hvor mye omsetning du får per krone brukt — høyere er bedre.
          <strong> CPA</strong> (kostnad per konvertering) viser hva du betaler per kjøp — lavere er bedre.
          <strong> CPM</strong> er hva du betaler per 1000 visninger — et mål på auksjonskostnaden.
          <strong> Frekvens</strong> er antall ganger samme person ser annonsene dine i snitt — over 6–8 er et tegn på publikumsmetning.
        </p>
        <p>
          <strong>Hva du ser etter:</strong> ROAS og CPA beveger seg som regel i motsatt retning av CPM og Frekvens. Stiger CPM og Frekvens uten at ROAS henger med, er det et tegn på at publikum er mettet eller at kreativene er utslitte.
          Kampanjetabellen lar deg bryte ned resultatene per kampanje og ad set — nyttig for å finne hva som driver (og hva som trekker ned) totalen.
        </p>
      </InfoBox>
    </div>
  );
}
