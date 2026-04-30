"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { AdLabRow } from "@/lib/types";
import SectionHeader from "@/components/ui/SectionHeader";
import KpiCard from "@/components/ui/KpiCard";
import AdSpendStream from "./AdSpendStream";
import AdHeatStrip from "./AdHeatStrip";
import CohortLifecycleChart from "./CohortLifecycleChart";
import clsx from "clsx";

type ViewMode = "calendar" | "since_launch";
type HeatMetric = "spend" | "purchases" | "roas";
type LifecycleMetric = "spend" | "spend_share" | "purchases" | "roas";

interface Props {
  clientSlug: string;
  ads: AdLabRow[];
}

interface Option {
  value: string;
  label: string;
  count: number;
  spend: number;
}

function formatSpend(v: number) {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${Math.round(v / 1000)}k`;
  return `${Math.round(v)}`;
}

function uniqueOptions(ads: AdLabRow[], key: "cohortLabel" | "campaignName" | "adsetName"): Option[] {
  const map = new Map<string, { count: number; spend: number; firstAd: AdLabRow }>();
  for (const ad of ads) {
    const value = ad[key];
    const existing = map.get(value);
    if (existing) {
      existing.count += 1;
      existing.spend += ad.totalSpend;
    } else {
      map.set(value, { count: 1, spend: ad.totalSpend, firstAd: ad });
    }
  }
  return Array.from(map.entries())
    .map(([value, info]) => ({ value, label: value, count: info.count, spend: info.spend }))
    .sort((a, b) => b.spend - a.spend);
}

export default function CreativeLabClient({ clientSlug, ads }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [heatMetric, setHeatMetric] = useState<HeatMetric>("spend");
  const [lifecycleMetric, setLifecycleMetric] = useState<LifecycleMetric>("spend_share");
  const [selectedCohorts, setSelectedCohorts] = useState<Set<string>>(new Set());
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set());
  const [selectedAdsets, setSelectedAdsets] = useState<Set<string>>(new Set());

  const cohortOptions = useMemo(() => uniqueOptions(ads, "cohortLabel"), [ads]);
  const campaignOptions = useMemo(() => uniqueOptions(ads, "campaignName"), [ads]);

  // Adset options depend on selected campaigns (cascading filter)
  const visibleAdsetOptions = useMemo(() => {
    const filtered = selectedCampaigns.size > 0 ? ads.filter((a) => selectedCampaigns.has(a.campaignName)) : ads;
    return uniqueOptions(filtered, "adsetName");
  }, [ads, selectedCampaigns]);

  // Apply filters
  const filteredAds = useMemo(() => {
    return ads.filter((ad) => {
      if (selectedCohorts.size > 0 && !selectedCohorts.has(ad.cohortLabel)) return false;
      if (selectedCampaigns.size > 0 && !selectedCampaigns.has(ad.campaignName)) return false;
      if (selectedAdsets.size > 0 && !selectedAdsets.has(ad.adsetName)) return false;
      return true;
    });
  }, [ads, selectedCohorts, selectedCampaigns, selectedAdsets]);

  // KPIs for filtered set
  const kpis = useMemo(() => {
    const totalSpend = filteredAds.reduce((s, a) => s + a.totalSpend, 0);
    const totalPurchases = filteredAds.reduce((s, a) => s + a.totalPurchases, 0);
    const totalPurchaseValue = filteredAds.reduce((s, a) => s + a.totalPurchaseValue, 0);
    const roas = totalSpend > 0 ? totalPurchaseValue / totalSpend : 0;
    const cohorts = new Set(filteredAds.map((a) => a.cohortLabel)).size;
    return { adCount: filteredAds.length, totalSpend, totalPurchases, roas, cohorts };
  }, [filteredAds]);

  function toggle(set: Set<string>, setter: (s: Set<string>) => void, value: string) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  function clearFilters() {
    setSelectedCohorts(new Set());
    setSelectedCampaigns(new Set());
    setSelectedAdsets(new Set());
  }

  const hasFilters =
    selectedCohorts.size > 0 || selectedCampaigns.size > 0 || selectedAdsets.size > 0;

  return (
    <div className="space-y-8">
      {/* Header with prototype banner + back link */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 uppercase tracking-wider">
                Prototype
              </span>
              <h1 className="text-lg font-semibold">Kreativ-laboratorium</h1>
            </div>
            <p className="text-sm text-neutral-700 max-w-2xl leading-snug">
              Per-ad spend-trajectories. Drill ned i hvordan algoritmen tester og fordeler — og hvilke
              annonser som tar fart over tid. Dette er en eksperimentell visning. Tilbakemeldinger styrer
              hva som blir permanent.
            </p>
          </div>
          <Link
            href={`/${clientSlug}/creative`}
            className="text-sm text-neutral-600 hover:text-neutral-900 whitespace-nowrap"
          >
            ← Tilbake til kreativ rapport
          </Link>
        </div>
      </div>

      {/* Filter row */}
      <div className="space-y-4">
        <FilterGroup
          label="Kohorter"
          help="Lansering-uke (uken annonsen fikk sin første spend)"
          options={cohortOptions}
          selected={selectedCohorts}
          onToggle={(v) => toggle(selectedCohorts, setSelectedCohorts, v)}
        />
        <FilterGroup
          label="Kampanjer"
          options={campaignOptions}
          selected={selectedCampaigns}
          onToggle={(v) => toggle(selectedCampaigns, setSelectedCampaigns, v)}
        />
        <FilterGroup
          label="Ad sets"
          help={selectedCampaigns.size > 0 ? "Begrenset til valgte kampanjer" : "Alle ad sets"}
          options={visibleAdsetOptions}
          selected={selectedAdsets}
          onToggle={(v) => toggle(selectedAdsets, setSelectedAdsets, v)}
        />
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-neutral-600 hover:text-neutral-900 underline"
          >
            Nullstill alle filtre
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 items-start">
        <KpiCard label="Annonser i utvalg" value={String(kpis.adCount)} note={`${kpis.cohorts} kohorter`} />
        <KpiCard label="Total Spend" value={formatSpend(kpis.totalSpend) + " kr"} />
        <KpiCard label="Kjøp" value={String(Math.round(kpis.totalPurchases))} />
        <KpiCard label="ROAS" value={kpis.roas.toFixed(2) + "x"} />
      </div>

      {/* Vindu 1: Stacked area */}
      <div>
        <SectionHeader
          title="Spend per annonse over tid"
          subtitle="Hver flate er én annonse. Farge = lansering-kohort."
          action={
            <ViewModeToggle value={viewMode} onChange={setViewMode} />
          }
        />
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <AdSpendStream ads={filteredAds} viewMode={viewMode} />
        </div>
      </div>

      {/* Vindu 2: Heat strip */}
      <div>
        <SectionHeader
          title="Annonse-grid (heat-strip)"
          subtitle="Én rad per annonse. Mørkere farge = mer aktivitet den uken."
          action={
            <div className="flex items-center gap-2">
              <MetricToggle
                value={heatMetric}
                onChange={setHeatMetric}
                options={[
                  { value: "spend", label: "Spend" },
                  { value: "purchases", label: "Kjøp" },
                  { value: "roas", label: "ROAS" },
                ]}
              />
            </div>
          }
        />
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <AdHeatStrip ads={filteredAds} viewMode={viewMode} metric={heatMetric} />
        </div>
      </div>

      {/* Vindu 3: Cohort lifecycle */}
      <div>
        <SectionHeader
          title="Kohort-livssyklus"
          subtitle="Hver linje er én kohort. X-akse: uker siden første spend. Sammenlign hvordan nye lanseringer starter mot eldre."
          action={
            <MetricToggle
              value={lifecycleMetric}
              onChange={setLifecycleMetric}
              options={[
                { value: "spend_share", label: "Spend-andel" },
                { value: "spend", label: "Spend per ad" },
                { value: "purchases", label: "Kjøp per ad" },
                { value: "roas", label: "ROAS" },
              ]}
            />
          }
        />
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <CohortLifecycleChart ads={filteredAds} metric={lifecycleMetric} />
        </div>
      </div>
    </div>
  );
}

function FilterGroup({
  label,
  help,
  options,
  selected,
  onToggle,
}: {
  label: string;
  help?: string;
  options: Option[];
  selected: Set<string>;
  onToggle: (value: string) => void;
}) {
  if (options.length === 0) return null;

  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-xs uppercase tracking-wider font-semibold text-neutral-700">
          {label}
        </span>
        {help && <span className="text-xs text-neutral-500">{help}</span>}
        {selected.size > 0 && (
          <span className="text-xs text-neutral-700 font-medium">{selected.size} valgt</span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const isSelected = selected.has(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => onToggle(opt.value)}
              className={clsx(
                "px-2.5 py-1 rounded-md text-xs border transition-colors",
                isSelected
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "bg-white text-neutral-700 border-neutral-300 hover:border-neutral-500"
              )}
            >
              <span className="font-medium">{opt.label}</span>
              <span className={clsx("ml-1.5 tabular-nums", isSelected ? "text-white/70" : "text-neutral-500")}>
                {opt.count} · {formatSpend(opt.spend)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ViewModeToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-neutral-300 bg-white overflow-hidden">
      <button
        onClick={() => onChange("calendar")}
        className={clsx(
          "px-3 py-1.5 text-xs font-medium",
          value === "calendar" ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-50"
        )}
      >
        Kalendertid
      </button>
      <button
        onClick={() => onChange("since_launch")}
        className={clsx(
          "px-3 py-1.5 text-xs font-medium border-l border-neutral-300",
          value === "since_launch" ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-50"
        )}
      >
        Siden lansering
      </button>
    </div>
  );
}

function MetricToggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-lg border border-neutral-300 bg-white overflow-hidden">
      {options.map((opt, i) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={clsx(
            "px-3 py-1.5 text-xs font-medium",
            i > 0 && "border-l border-neutral-300",
            value === opt.value ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-50"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
