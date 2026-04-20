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
  { value: "7d", label: "7 dager" },
  { value: "30d", label: "30 dager" },
  { value: "prev_month", label: "Forrige mnd" },
  { value: "3m", label: "3 mnd" },
  { value: "6m", label: "6 mnd" },
  { value: "12m", label: "12 mnd" },
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
      <tr className="border-b border-[var(--color-border)] hover:bg-[var(--color-gray-50)] transition-colors">
        <td className="px-5 py-3">
          <div className="flex items-center gap-2" style={{ paddingLeft: depth * 20 }}>
            {hasChildren && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-[var(--color-gray-400)] hover:text-[var(--color-black)] text-xs w-4"
              >
                {expanded ? "v" : ">"}
              </button>
            )}
            {!hasChildren && <span className="w-4" />}
            <span className={clsx("text-sm", depth === 0 ? "font-medium" : "text-[var(--color-gray-600)]")}>
              {campaign.name}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-right tabular-nums">
          {formatNok(campaign.spend)}
        </td>
        <td className="px-4 py-3 text-right tabular-nums">
          {campaign.roas.toFixed(1)}x
        </td>
        <td className="px-4 py-3 text-right tabular-nums">
          {Math.round(campaign.cpa)} kr
        </td>
        <td className="px-4 py-3 text-right tabular-nums">
          {Math.round(campaign.cpm)} kr
        </td>
        <td className="px-4 py-3 text-right tabular-nums">
          {campaign.frequency.toFixed(1)}
        </td>
        <td className="px-4 py-3 text-right tabular-nums">
          {campaign.ctr.toFixed(1)}%
        </td>
        <td className="px-4 py-3 text-right text-sm tabular-nums">
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
    <div className="space-y-10">
      {/* Period selector + compare toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Period */}
        <div className="flex gap-1">
          {PERIOD_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => navigate(value, compare)}
              className={clsx(
                "text-xs font-medium px-3 py-1.5 rounded-md transition-all whitespace-nowrap",
                period === value
                  ? "bg-[var(--color-gray-100)] text-[var(--color-black)]"
                  : "text-[var(--color-gray-500)] hover:text-[var(--color-black)] hover:bg-[var(--color-gray-50)]"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Compare */}
        <div className="flex gap-1">
          {COMPARE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => navigate(period, value)}
              className={clsx(
                "text-xs font-medium px-3 py-1.5 rounded-md transition-all whitespace-nowrap",
                compare === value
                  ? "bg-[var(--color-gray-100)] text-[var(--color-black)]"
                  : "text-[var(--color-gray-500)] hover:text-[var(--color-black)] hover:bg-[var(--color-gray-50)]"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPIs */}
      <div>
        <SectionHeader title="Nokkeltall" subtitle={kpis.periodLabel} />
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
            note="per 1k net new reach"
          />
          <KpiCard
            label="Frekvens"
            value={kpis.frequency.toFixed(1)}
            delta={kpis.frequencyDelta}
            deltaLabel={deltaLabel}
            invertDelta
            note={kpis.frequency > 8 ? "For hoy - audience fatigue" : kpis.frequency > 6 ? "Moderat" : "Frisk"}
          />
          <KpiCard
            label="CTR (Link)"
            value={`${kpis.ctr.toFixed(1)}%`}
            delta={kpis.ctrDelta}
            deltaLabel={deltaLabel}
          />
        </div>
      </div>

      {/* Trend chart */}
      <div>
        <SectionHeader title="Spend og ROAS - trend" subtitle={kpis.periodLabel} />
        <div className="rounded-lg border border-[var(--color-border)] p-5 bg-white">
          <SpendTrendChart data={trend} days={365} />
          <div className="flex gap-6 mt-4 text-xs text-[var(--color-gray-400)]">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2.5 rounded-sm bg-[var(--color-gray-200)] inline-block" />
              Spend (NOK)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-[var(--color-gray-600)] inline-block" />
              ROAS
            </span>
          </div>
        </div>
      </div>

      {/* Campaign table */}
      <div>
        <SectionHeader
          title="Kampanjer"
          subtitle="Klikk > for a se ad sets"
        />
        <div className="rounded-lg border border-[var(--color-border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-gray-50)]">
                {["Kampanje", "Spend", "ROAS", "CPA", "CPM", "Freq.", "CTR", "Reach"].map((h) => (
                  <th
                    key={h}
                    className={clsx(
                      "py-3 text-xs font-medium text-[var(--color-gray-500)]",
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
