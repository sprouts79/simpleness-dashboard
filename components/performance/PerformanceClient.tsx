"use client";

import { useRouter } from "next/navigation";
import KpiCard from "@/components/ui/KpiCard";
import SectionHeader from "@/components/ui/SectionHeader";
import SpendTrendChart from "@/components/charts/SpendTrendChart";
import { PerformanceKpis, SpendTrendPoint, Campaign, PeriodKey, CompareKey } from "@/lib/types";
import clsx from "clsx";
import { useState } from "react";

const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: "today", label: "I gar" },
  { value: "7d", label: "Siste 7 dager" },
  { value: "30d", label: "Siste 30 dager" },
  { value: "prev_month", label: "Forrige maned" },
  { value: "3m", label: "Siste 3 maneder" },
  { value: "6m", label: "Siste 6 maneder" },
  { value: "12m", label: "Siste ar" },
];

const COMPARE_OPTIONS: { value: CompareKey; label: string }[] = [
  { value: "period", label: "Forrige periode" },
  { value: "year", label: "Forrige ar" },
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
        <td className="px-5 py-3.5">
          <div className="flex items-center gap-2" style={{ paddingLeft: depth * 20 }}>
            {hasChildren && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-[rgba(9,10,8,0.4)] hover:text-[var(--color-black)] text-sm w-4"
              >
                {expanded ? "v" : ">"}
              </button>
            )}
            {!hasChildren && <span className="w-4" />}
            <span className={clsx("text-base", depth === 0 ? "font-medium" : "text-[rgba(9,10,8,0.7)]")}>
              {campaign.name}
            </span>
          </div>
        </td>
        <td className="px-4 py-3.5 text-right text-sm" style={{ fontFamily: "var(--font-mono)" }}>
          {formatNok(campaign.spend)}
        </td>
        <td className="px-4 py-3.5 text-right text-sm" style={{ fontFamily: "var(--font-mono)" }}>
          {campaign.roas.toFixed(1)}x
        </td>
        <td className="px-4 py-3.5 text-right text-sm" style={{ fontFamily: "var(--font-mono)" }}>
          {Math.round(campaign.cpa)} kr
        </td>
        <td className="px-4 py-3.5 text-right text-sm" style={{ fontFamily: "var(--font-mono)" }}>
          {Math.round(campaign.cpm)} kr
        </td>
        <td className="px-4 py-3.5 text-right text-sm" style={{ fontFamily: "var(--font-mono)" }}>
          {campaign.frequency.toFixed(1)}
        </td>
        <td className="px-4 py-3.5 text-right text-sm" style={{ fontFamily: "var(--font-mono)" }}>
          {campaign.ctr.toFixed(1)}%
        </td>
        <td className="px-4 py-3.5 text-right text-sm" style={{ fontFamily: "var(--font-mono)" }}>
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
      <div className="flex items-center gap-4">
        {/* Period dropdown */}
        <select
          value={period}
          onChange={(e) => navigate(e.target.value as PeriodKey, compare)}
          className="text-sm font-semibold bg-[var(--color-surface)] border-0 rounded-lg px-4 py-2.5 text-[var(--color-black)] cursor-pointer appearance-none pr-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23090a08' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
          }}
        >
          {PERIOD_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <span className="text-sm text-[rgba(9,10,8,0.4)]">vs.</span>

        {/* Compare toggle */}
        <div className="flex bg-[var(--color-surface)] rounded-lg p-1 gap-1">
          {COMPARE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => navigate(period, value)}
              className={clsx(
                "text-sm font-semibold px-4 py-2 rounded-md transition-colors whitespace-nowrap",
                compare === value
                  ? "bg-white text-[var(--color-black)] shadow-sm"
                  : "text-[rgba(9,10,8,0.5)] hover:text-[var(--color-black)]"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPIs */}
      <div>
        <SectionHeader title="Oppsummering" />
        <div className="grid grid-cols-3 gap-4 mb-4">
          <KpiCard
            label="Spend"
            value={formatNok(kpis.spend)}
            delta={kpis.spendDelta}
            deltaLabel={deltaLabel}
            size="large"
          />
          <KpiCard
            label="ROAS"
            value={`${kpis.roas.toFixed(1)}x`}
            delta={kpis.roasDelta}
            deltaLabel={deltaLabel}
            size="large"
          />
          <KpiCard
            label="CPA"
            value={`${Math.round(kpis.cpa)} kr`}
            delta={kpis.cpaDelta}
            deltaLabel={deltaLabel}
            invertDelta
            size="large"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <KpiCard
            label="CPMn"
            value={kpis.cpmn > 0 ? `${Math.round(kpis.cpmn)} kr` : "-"}
            delta={kpis.cpmn > 0 ? kpis.cpmnDelta : undefined}
            deltaLabel={deltaLabel}
            invertDelta
          />
          <KpiCard
            label="Frekvens"
            value={kpis.frequency.toFixed(1)}
            delta={kpis.frequencyDelta}
            deltaLabel={deltaLabel}
            invertDelta
          />
          <KpiCard
            label="CTR"
            value={`${kpis.ctr.toFixed(1)}%`}
            delta={kpis.ctrDelta}
            deltaLabel={deltaLabel}
          />
        </div>
      </div>

      {/* Trend chart */}
      <div>
        <SectionHeader title="Utvikling over tid" />
        <div className="rounded-xl border border-[var(--color-border)] p-4 bg-white">
          <SpendTrendChart data={trend} days={365} />
          <div className="flex gap-6 mt-4 text-sm text-[rgba(9,10,8,0.6)]">
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3 rounded-sm bg-[rgba(9,10,8,0.12)] inline-block" />
              Spend
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--color-black)] inline-block" />
              ROAS
            </span>
          </div>
        </div>
      </div>

      {/* Campaign table */}
      <div>
        <SectionHeader title="Kampanjer" />
        <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
          <table className="w-full text-base">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                {["Kampanje", "Spend", "ROAS", "Kost/kjop", "CPM", "Frekvens", "CTR", "Reach"].map((h) => (
                  <th
                    key={h}
                    className={clsx(
                      "py-3.5 text-2xs font-semibold uppercase tracking-widest text-[rgba(9,10,8,0.5)]",
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

    </div>
  );
}
