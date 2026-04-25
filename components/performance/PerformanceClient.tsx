"use client";

import { useRouter } from "next/navigation";
import KpiCard from "@/components/ui/KpiCard";
import SectionHeader from "@/components/ui/SectionHeader";
import PillSelect from "@/components/ui/PillSelect";
import SpendTrendChart from "@/components/charts/SpendTrendChart";
import { CHART_BAR_COLOR, CHART_LINE_COLOR } from "@/lib/chart-colors";
import { PerformanceKpis, SpendTrendPoint, Campaign, PeriodKey, CompareKey } from "@/lib/types";
import clsx from "clsx";
import { useState } from "react";

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
      <tr className="border-b border-[var(--color-border)] hover:bg-white transition-colors">
        <td className="px-5 py-3">
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
            <span className={clsx("text-sm", depth === 0 ? "font-medium" : "text-[rgba(9,10,8,0.6)]")}>
              {campaign.name}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-right text-sm" style={{ fontFamily: "var(--font-mono)" }}>
          {formatNok(campaign.spend)}
        </td>
        <td className="px-4 py-3 text-right text-sm" style={{ fontFamily: "var(--font-mono)" }}>
          {campaign.roas.toFixed(1)}x
        </td>
        <td className="px-4 py-3 text-right text-sm" style={{ fontFamily: "var(--font-mono)" }}>
          {Math.round(campaign.cpa)} kr
        </td>
        <td className="px-4 py-3 text-right text-sm" style={{ fontFamily: "var(--font-mono)" }}>
          {Math.round(campaign.cpm)} kr
        </td>
        <td className="px-4 py-3 text-right text-sm" style={{ fontFamily: "var(--font-mono)" }}>
          {campaign.frequency.toFixed(1)}
        </td>
        <td className="px-4 py-3 text-right text-sm" style={{ fontFamily: "var(--font-mono)" }}>
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
      <div className="flex items-center gap-3">
        <PillSelect
          value={period}
          onChange={(v) => navigate(v as PeriodKey, compare)}
          options={PERIOD_OPTIONS}
        />

        <span className="text-sm text-neutral-500">vs.</span>

        {/* Compare toggle */}
        <div className="inline-flex bg-neutral-100 rounded-lg p-0.5">
          {COMPARE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => navigate(period, value)}
              className={clsx(
                "text-xs font-medium px-3 py-1.5 rounded-md transition-colors whitespace-nowrap",
                compare === value
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900"
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
        <div className="grid grid-cols-3 gap-4 mb-4 items-start">
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
        <div className="grid grid-cols-3 gap-4 items-start">
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
              <span className="w-3.5 h-3 rounded-sm inline-block" style={{ backgroundColor: CHART_BAR_COLOR }} />
              Spend
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: CHART_LINE_COLOR }} />
              ROAS
            </span>
          </div>
        </div>
      </div>

      {/* Campaign table */}
      <div>
        <SectionHeader title="Kampanjer" />
        <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                {["Kampanje", "Spend", "ROAS", "CPA", "CPM", "Frekvens", "CTR", "Reach"].map((h) => (
                  <th
                    key={h}
                    className={clsx(
                      "py-2.5 text-xs font-medium text-neutral-500",
                      h === "Kampanje" ? "text-left px-4" : "text-right px-3"
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
