"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { PERFORMANCE_KPIS, SPEND_TREND, CAMPAIGNS } from "@/lib/mock-data";
import KpiCard from "@/components/ui/KpiCard";
import SectionHeader from "@/components/ui/SectionHeader";
import SpendTrendChart from "@/components/charts/SpendTrendChart";
import { Campaign } from "@/lib/types";
import clsx from "clsx";

type Period = "wow" | "mom";
type TrendDays = 7 | 30 | 90;

function formatNok(n: number) {
  if (n >= 1000000) return `NOK ${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `NOK ${Math.round(n / 1000)}k`;
  return `NOK ${n}`;
}

function DeltaChip({ value, invert = false }: { value: number; invert?: boolean }) {
  const good = invert ? value < 0 : value > 0;
  const sign = value > 0 ? "+" : "";
  return (
    <span
      className={clsx("text-xs", {
        "text-green-600": good,
        "text-red-500": !good && value !== 0,
        "text-[rgba(9,10,8,0.35)]": value === 0,
      })}
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {sign}{value.toFixed(1)}%
    </span>
  );
}

function CampaignRow({ campaign, depth = 0 }: { campaign: Campaign; depth?: number }) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = campaign.adSets && campaign.adSets.length > 0;

  return (
    <>
      <tr
        className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors"
        style={{ paddingLeft: depth * 16 }}
      >
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
          {campaign.cpa} kr
        </td>
        <td className="px-4 py-3 text-right" style={{ fontFamily: "var(--font-mono)" }}>
          {campaign.cpm} kr
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

export default function PerformancePage() {
  const params = useParams();
  const clientId = params.client as string;
  const [period, setPeriod] = useState<Period>("wow");
  const [trendDays, setTrendDays] = useState<TrendDays>(30);

  const kpis = PERFORMANCE_KPIS[clientId];
  const trend = SPEND_TREND[clientId] ?? [];
  const campaigns = CAMPAIGNS[clientId] ?? [];

  if (!kpis) return <div className="p-8 text-sm text-[rgba(9,10,8,0.4)]">Ingen data.</div>;

  const deltaRoas = period === "wow" ? kpis.roasDeltaWow : kpis.roasDeltaMom;
  const deltaCpa = period === "wow" ? kpis.cpaDeltaWow : kpis.cpaDeltaMom;
  const deltaCpm = period === "wow" ? kpis.cpmDeltaWow : kpis.cpmDeltaMom;
  const deltaSpend = period === "wow" ? kpis.spendDeltaWow : kpis.spendDeltaMom;

  return (
    <div className="space-y-8">
      {/* Period toggle */}
      <div className="flex items-center justify-between">
        <div />
        <div className="flex bg-[var(--color-surface)] rounded-lg p-1 gap-1">
          {(["wow", "mom"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={clsx(
                "text-xs font-semibold px-3 py-1.5 rounded-md transition-colors",
                period === p
                  ? "bg-white text-[var(--color-black)] shadow-sm"
                  : "text-[rgba(9,10,8,0.45)] hover:text-[var(--color-black)]"
              )}
            >
              {p === "wow" ? "Uke vs uke" : "Måned vs måned"}
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPIs */}
      <div>
        <SectionHeader title="Nøkkeltall" subtitle="Siste 30 dager" />
        <div className="grid grid-cols-3 gap-3 mb-3">
          <KpiCard
            label="Spend"
            value={`NOK ${Math.round(kpis.spend / 1000)}k`}
            delta={deltaSpend}
            deltaLabel={period === "wow" ? "vs forrige uke" : "vs forrige måned"}
            size="large"
          />
          <KpiCard
            label="ROAS"
            value={`${kpis.roas.toFixed(1)}×`}
            delta={deltaRoas}
            deltaLabel={period === "wow" ? "vs forrige uke" : "vs forrige måned"}
            size="large"
          />
          <KpiCard
            label="CPA"
            value={`${kpis.cpa} kr`}
            delta={deltaCpa}
            deltaLabel={period === "wow" ? "vs forrige uke" : "vs forrige måned"}
            size="large"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <KpiCard
            label="CPM"
            value={`${kpis.cpm} kr`}
            delta={deltaCpm}
            deltaLabel={period === "wow" ? "vs forrige uke" : "vs forrige måned"}
          />
          <KpiCard
            label="Frekvens"
            value={kpis.frequency.toFixed(1)}
            delta={kpis.frequencyDeltaWow}
            note={kpis.frequency > 8 ? "⚠ For høy — audience fatigue" : kpis.frequency > 6 ? "Moderat" : "Frisk"}
          />
          <KpiCard
            label="CTR (Link)"
            value={`${kpis.ctr.toFixed(1)}%`}
            delta={kpis.ctrDeltaWow}
          />
        </div>
      </div>

      {/* Trend chart */}
      <div>
        <SectionHeader
          title="Spend & ROAS — trend"
          action={
            <div className="flex bg-[var(--color-surface)] rounded-lg p-1 gap-1">
              {([7, 30, 90] as TrendDays[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setTrendDays(d)}
                  className={clsx(
                    "text-xs font-semibold px-2.5 py-1 rounded-md transition-colors",
                    trendDays === d
                      ? "bg-white text-[var(--color-black)] shadow-sm"
                      : "text-[rgba(9,10,8,0.45)] hover:text-[var(--color-black)]"
                  )}
                >
                  {d}d
                </button>
              ))}
            </div>
          }
        />
        <div className="rounded-xl border border-[var(--color-border)] p-4 bg-white">
          <SpendTrendChart data={trend} days={trendDays} />
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
    </div>
  );
}
