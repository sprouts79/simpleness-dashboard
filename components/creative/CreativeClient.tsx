"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import SectionHeader from "@/components/ui/SectionHeader";
import KpiCard from "@/components/ui/KpiCard";
import RefreshButton from "@/components/ui/RefreshButton";
import CohortSpendChart, { COHORT_COLORS } from "@/components/charts/CohortSpendChart";
import { Ad, AdCohort, CreativeChurnPoint, CohortMetric } from "@/lib/types";
import clsx from "clsx";

type MetricKey = CohortMetric;

const METRIC_OPTIONS: { value: MetricKey; label: string; unit: string; higherIsBetter: boolean }[] = [
  { value: "spend", label: "Spend", unit: "kr", higherIsBetter: true },
  { value: "ctr", label: "CTR", unit: "%", higherIsBetter: true },
  { value: "hookRate", label: "Hook Rate", unit: "%", higherIsBetter: true },
  { value: "holdRate", label: "Hold Rate", unit: "%", higherIsBetter: true },
  { value: "roas", label: "ROAS", unit: "x", higherIsBetter: true },
  { value: "cpm", label: "CPM", unit: "kr", higherIsBetter: false },
  { value: "cpa", label: "CPA", unit: "kr", higherIsBetter: false },
];

// Get color based on percentile (0 to 1) for heatmap
// Uses a smooth continuous spectrum from red to green
function getHeatmapColor(percentile: number, higherIsBetter: boolean): string {
  const t = higherIsBetter ? percentile : 1 - percentile;
  
  // Smooth HSL interpolation: red (0) -> orange (30) -> yellow (55) -> lime (90) -> green (120)
  const hue = t * 120; // 0 = red, 60 = yellow, 120 = green
  const saturation = 55 + t * 15; // 55% to 70% - more saturated for green
  const lightness = 78 - t * 10; // 78% to 68% - darker for greener values
  
  return `hsla(${hue}, ${saturation}%, ${lightness}%, 1)`;
}

function getHeatmapTextColor(percentile: number, higherIsBetter: boolean): string {
  const t = higherIsBetter ? percentile : 1 - percentile;
  
  // Darker text matching the hue
  const hue = t * 120;
  const saturation = 70;
  const lightness = 25;
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function formatValue(value: number, metric: MetricKey): string {
  if (metric === "spend") {
    return value >= 1000 ? `${Math.round(value / 1000)}k` : `${Math.round(value)}`;
  }
  if (metric === "cpm" || metric === "cpa") {
    return `${Math.round(value)}`;
  }
  if (metric === "roas") {
    return value.toFixed(1);
  }
  return value.toFixed(1);
}

export default function CreativeClient({
  clientId,
  ads,
  cohorts,
  churnData,
  topWeek,
  topMonth,
  topQuarter,
}: {
  clientId: string;
  ads: Ad[];
  cohorts: AdCohort[];
  churnData: CreativeChurnPoint[];
  topWeek: Ad[];
  topMonth: Ad[];
  topQuarter: Ad[];
}) {
  const router = useRouter();
  const [metric, setMetric] = useState<MetricKey>("spend");
  const [period, setPeriod] = useState<"3m" | "6m">("3m");
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [expandedCohort, setExpandedCohort] = useState<string | null>(null);

  const selectedMetricInfo = METRIC_OPTIONS.find(m => m.value === metric)!;

  // Calculate week columns (W0 to W11)
  const weekColumns = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  // Calculate min/max for each week column for heatmap
  // Store sorted values per week for percentile-based coloring
  const weekValues = useMemo(() => {
    const result: Record<number, number[]> = {};
    weekColumns.forEach(weekNum => {
      const values = cohorts
        .map(c => c.weeks.find(w => w.weekNumber === weekNum))
        .filter(Boolean)
        .map(w => w![metric] ?? 0)
        .filter(v => v > 0)
        .sort((a, b) => a - b); // Sort ascending
      result[weekNum] = values;
    });
    return result;
  }, [cohorts, metric]);
  
  // Get percentile rank of a value within a week (0 to 1)
  const getPercentile = (value: number, weekNum: number): number => {
    const values = weekValues[weekNum] || [];
    if (values.length <= 1) return 0.5; // Single value = middle
    const index = values.indexOf(value);
    if (index === -1) {
      // Value not found exactly, find where it would fit
      const lowerCount = values.filter(v => v < value).length;
      return lowerCount / (values.length - 1);
    }
    return index / (values.length - 1);
  };

  // KPIs
  const kpis = useMemo(() => {
    const activeAds = ads.filter(a => a.status === "active").length;
    const activeCohorts = cohorts.filter(c => 
      c.weeks.some(w => w.weekNumber <= 4 && (w.spend ?? 0) > 0)
    ).length;
    const totalSpend = cohorts.reduce((sum, c) => 
      sum + c.weeks.reduce((s, w) => s + (w.spend ?? 0), 0), 0
    );
    
    return { activeAds, activeCohorts, totalSpend };
  }, [ads, cohorts]);

  // Group ads by cohort - use cohortDate from ads to match
  const adsByCohort = useMemo(() => {
    const grouped: Record<string, Ad[]> = {};
    
    // Sort cohorts by date to assign ads in order
    const sortedCohorts = [...cohorts].sort((a, b) => 
      new Date(b.cohortDate).getTime() - new Date(a.cohortDate).getTime()
    );
    
    // Sort ads by cohortDate (or createdAt as fallback)
    const sortedAds = [...ads].sort((a, b) => {
      const dateA = a.cohortDate || a.createdAt || "";
      const dateB = b.cohortDate || b.createdAt || "";
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
    
    // Assign ads to cohorts based on their position/count
    let adIndex = 0;
    sortedCohorts.forEach(c => {
      const count = c.adCount || 0;
      grouped[c.cohortDate] = sortedAds.slice(adIndex, adIndex + count);
      adIndex += count;
    });
    
    return grouped;
  }, [cohorts, ads]);

  // Top 10 by purchases (which ads drive most conversions)
  const topByPurchases = useMemo(() =>
    [...ads].sort((a, b) => b.purchases - a.purchases).slice(0, 10),
  [ads]);

  // Top 10 by reach (which ads reach the most people)
  const topByReach = useMemo(() =>
    [...ads].sort((a, b) => b.reach - a.reach).slice(0, 10),
  [ads]);
  
  // State for expanded ad in top lists
  const [expandedAdId, setExpandedAdId] = useState<string | null>(null);

  async function handleSync() {
    setSyncing(true);
    setSyncStatus(null);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, syncType: "cohort" }),
      });
      const json = await res.json();
      if (json.ok) {
        setSyncStatus("Synkronisert");
        router.refresh();
      } else {
        setSyncStatus(`Feil: ${json.errors?.join(", ") || "Ukjent"}`);
      }
    } catch (e: unknown) {
      setSyncStatus(`Feil: ${e instanceof Error ? e.message : "Ukjent"}`);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-10">
      {/* Header with period selector and sync button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPeriod("3m")}
            className={clsx(
              "text-sm font-semibold px-4 py-2 rounded-lg transition-colors",
              period === "3m"
                ? "bg-[var(--color-black)] text-white"
                : "bg-[var(--color-surface)] text-[rgba(9,10,8,0.6)] hover:text-[var(--color-black)]"
            )}
          >
            3 mnd
          </button>
          <button
            onClick={() => setPeriod("6m")}
            className={clsx(
              "text-sm font-semibold px-4 py-2 rounded-lg transition-colors",
              period === "6m"
                ? "bg-[var(--color-black)] text-white"
                : "bg-[var(--color-surface)] text-[rgba(9,10,8,0.6)] hover:text-[var(--color-black)]"
            )}
          >
            6 mnd
          </button>
        </div>
        <div className="flex items-center gap-4">
          {syncStatus && (
            <span className="text-sm text-[rgba(9,10,8,0.55)]">{syncStatus}</span>
          )}
          <RefreshButton onClick={handleSync} loading={syncing} label="Oppdater" loadingLabel="Henter…" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Aktive annonser" value={String(kpis.activeAds)} />
        <KpiCard label="Aktive kohorter" value={String(kpis.activeCohorts)} />
        <KpiCard label="Total Spend" value={`${Math.round(kpis.totalSpend / 1000)}k`} />
      </div>

      {/* Cohort Heatmap Table with Thumbnails */}
      {cohorts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-[var(--color-black)]">Kohort-ytelse</h2>
              <p className="text-sm text-[rgba(9,10,8,0.55)] mt-0.5">
                Farge viser prestasjon relativt til andre kohorter per uke
              </p>
            </div>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as MetricKey)}
              className="text-sm font-semibold bg-[var(--color-surface)] border-0 rounded-lg px-4 py-2.5 text-[var(--color-black)] cursor-pointer appearance-none pr-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23090a08' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
              }}
            >
              {METRIC_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
            {/* Cohort cards */}
            {(() => {
              // Sort cohorts by date for consistent color assignment
              const sortedByDate = [...cohorts].sort((a, b) => 
                new Date(a.cohortDate).getTime() - new Date(b.cohortDate).getTime()
              );
              const colorMap = new Map(sortedByDate.map((c, i) => [c.cohortDate, COHORT_COLORS[i % COHORT_COLORS.length]]));
              
              return cohorts.map((cohort) => {
                const totalSpend = cohort.weeks.reduce((s, w) => s + (w.spend ?? 0), 0);
                const cohortAds = adsByCohort[cohort.cohortDate] || [];
                const isExpanded = expandedCohort === cohort.cohortDate;
                const cohortColor = colorMap.get(cohort.cohortDate) || COHORT_COLORS[0];
              
              return (
                <div
                  key={cohort.cohortDate}
                  className={clsx(
                    "rounded-xl border bg-white overflow-hidden transition-all",
                    isExpanded ? "border-neutral-300 ring-1 ring-neutral-100" : "border-neutral-200"
                  )}
                >
                  {/* Card header */}
                  <div 
                    className="px-5 py-4 cursor-pointer hover:bg-white transition-colors"
                    onClick={() => setExpandedCohort(isExpanded ? null : cohort.cohortDate)}
                  >
                    {/* Top section: Thumbnails + info */}
                    <div className="flex items-center gap-4 mb-4">
                      {/* Stacked thumbnails */}
                      <div className="flex -space-x-4 flex-shrink-0">
                        {cohortAds.slice(0, 4).map((ad, i) => (
                          <div 
                            key={ad.id}
                            className="w-16 h-16 rounded-lg bg-[rgba(9,10,8,0.08)] border-2 border-[var(--color-surface)] overflow-hidden"
                            style={{ zIndex: 4 - i }}
                          >
                            {ad.thumbnailUrl ? (
                              <img src={ad.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-[rgba(9,10,8,0.3)]">
                                {ad.format?.charAt(0) || "?"}
                              </div>
                            )}
                          </div>
                        ))}
                        {cohortAds.length > 4 && (
                          <div 
                            className="w-16 h-16 rounded-lg bg-[rgba(9,10,8,0.12)] border-2 border-[var(--color-surface)] flex items-center justify-center text-xs font-medium text-[rgba(9,10,8,0.5)]"
                            style={{ zIndex: 0 }}
                          >
                            +{cohortAds.length - 4}
                          </div>
                        )}
                      </div>
                      
                      {/* Cohort info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: cohortColor }}
                          />
                          <h3 className="text-base font-semibold">{cohort.label}</h3>
                          <span className="text-sm text-[rgba(9,10,8,0.5)]">
                            {cohort.adCount} annonser
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-[rgba(9,10,8,0.5)]">
                          <span className="font-mono">
                            Spend: <span className="text-[var(--color-black)]">{totalSpend >= 1000 ? `${Math.round(totalSpend / 1000)}k` : Math.round(totalSpend)}</span>
                          </span>
                        </div>
                      </div>
                      
                      {/* Expand indicator */}
                      <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[rgba(9,10,8,0.35)] text-base">
                        {isExpanded ? "−" : "+"}
                      </div>
                    </div>
                    
                    {/* Heatmap row */}
                    <div className="flex items-center gap-1">
                      {weekColumns.map(weekNum => {
                        const weekData = cohort.weeks.find(w => w.weekNumber === weekNum);
                        const value = weekData?.[metric] ?? 0;
                        const hasData = weekData && value > 0;
                        const percentile = hasData ? getPercentile(value, weekNum) : 0.5;
                        
                        return (
                          <div key={weekNum} className="flex-1 text-center">
                            {weekNum === 0 && (
                              <div className="text-[10px] text-[rgba(9,10,8,0.4)] mb-1">W0</div>
                            )}
                            {weekNum === 11 && (
                              <div className="text-[10px] text-[rgba(9,10,8,0.4)] mb-1">W11</div>
                            )}
                            {weekNum !== 0 && weekNum !== 11 && (
                              <div className="text-[10px] text-[rgba(9,10,8,0.25)] mb-1">{weekNum}</div>
                            )}
                            {hasData ? (
                              <div
                                className="px-1 py-1.5 rounded text-[11px] font-bold font-mono"
                                style={{
                                  backgroundColor: getHeatmapColor(percentile, selectedMetricInfo.higherIsBetter),
                                  color: getHeatmapTextColor(percentile, selectedMetricInfo.higherIsBetter),
                                }}
                              >
                                {formatValue(value, metric)}
                              </div>
                            ) : (
                              <div className="px-1 py-1.5 rounded text-[11px] text-[rgba(9,10,8,0.15)] bg-[rgba(9,10,8,0.03)]">
                                -
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Expanded gallery */}
                  {isExpanded && cohortAds.length > 0 && (
                    <div className="px-5 pb-5 border-t border-[var(--color-border)] pt-4">
                      <div className="grid grid-cols-6 gap-4">
                        {cohortAds.map((ad) => (
                          <div key={ad.id} className="group">
                            <div className="aspect-[9/16] rounded-lg bg-[rgba(9,10,8,0.06)] overflow-hidden mb-2 relative">
                              {ad.thumbnailUrl ? (
                                <img src={ad.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-[rgba(9,10,8,0.3)]">
                                  {ad.format}
                                </div>
                              )}
                              {/* KPI overlay */}
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-2 pt-6">
                                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] font-mono text-white/90">
                                  <div>
                                    <span className="text-white/50">Spend</span>
                                    <p className="font-semibold">{ad.spend >= 1000 ? `${Math.round(ad.spend / 1000)}k` : Math.round(ad.spend)}</p>
                                  </div>
                                  <div>
                                    <span className="text-white/50">CTR</span>
                                    <p className="font-semibold">{ad.ctr.toFixed(2)}%</p>
                                  </div>
                                  <div>
                                    <span className="text-white/50">CPM</span>
                                    <p className="font-semibold">{Math.round(ad.cpm)}</p>
                                  </div>
                                  <div>
                                    <span className="text-white/50">ROAS</span>
                                    <p className="font-semibold">{ad.roas?.toFixed(1) || "-"}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-[rgba(9,10,8,0.7)] truncate font-medium">{ad.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            });
            })()}
          </div>
        </div>
      )}

      {/* Cohort Spend Over Time Chart */}
      {cohorts.length > 0 && (
        <div>
          <SectionHeader 
            title="Spend fordelt per kohort over tid" 
            subtitle="Se hvordan ulike kohorter bidrar til total spend uke for uke"
          />
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <CohortSpendChart cohorts={cohorts} />
          </div>
        </div>
      )}

      {/* Top 10 Lists */}
      <div className="grid grid-cols-2 gap-6">
        {/* Top by Spend */}
        <div>
          <SectionHeader title="Hvilke annonser får flest kjøp?" />
          <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
            <div className="divide-y divide-neutral-100">
              {topByPurchases.map((ad, i) => {
                const isExpanded = expandedAdId === `purchases-${ad.id}`;
                return (
                  <div key={ad.id}>
                    <div
                      className="flex items-center gap-4 px-4 py-3 hover:bg-white transition-colors cursor-pointer"
                      onClick={() => setExpandedAdId(isExpanded ? null : `purchases-${ad.id}`)}
                    >
                      <span className="w-6 text-sm font-mono text-[rgba(9,10,8,0.4)]">{i + 1}</span>
                      <div className="w-10 h-10 rounded-lg bg-[rgba(9,10,8,0.06)] overflow-hidden flex-shrink-0">
                        {ad.thumbnailUrl ? (
                          <img src={ad.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-[rgba(9,10,8,0.3)]">?</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ad.name}</p>
                        <p className="text-xs text-[rgba(9,10,8,0.5)]">ROAS {ad.roas?.toFixed(1) || "-"}× · CPA {ad.cpa > 0 ? `${Math.round(ad.cpa)} kr` : "-"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono font-semibold">{ad.purchases} kjøp</p>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-4 pb-4 bg-white">
                        <div className="flex gap-4">
                          <div className="w-32 aspect-[9/16] rounded-lg bg-[rgba(9,10,8,0.06)] overflow-hidden flex-shrink-0">
                            {ad.thumbnailUrl ? (
                              <img src={ad.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-[rgba(9,10,8,0.3)]">{ad.format}</div>
                            )}
                          </div>
                          <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2 text-sm py-2">
                            <div><span className="text-[rgba(9,10,8,0.5)]">Kjøp</span><p className="font-mono font-semibold">{ad.purchases}</p></div>
                            <div><span className="text-[rgba(9,10,8,0.5)]">ROAS</span><p className="font-mono font-semibold">{ad.roas?.toFixed(1) || "-"}×</p></div>
                            <div><span className="text-[rgba(9,10,8,0.5)]">CPA</span><p className="font-mono font-semibold">{ad.cpa > 0 ? `${Math.round(ad.cpa)} kr` : "-"}</p></div>
                            <div><span className="text-[rgba(9,10,8,0.5)]">Spend</span><p className="font-mono font-semibold">{ad.spend >= 1000 ? `${Math.round(ad.spend / 1000)}k` : Math.round(ad.spend)}</p></div>
                            <div><span className="text-[rgba(9,10,8,0.5)]">CTR</span><p className="font-mono font-semibold">{ad.ctr.toFixed(1)}%</p></div>
                            <div><span className="text-[rgba(9,10,8,0.5)]">Impressions</span><p className="font-mono font-semibold">{ad.impressions >= 1000 ? `${Math.round(ad.impressions / 1000)}k` : ad.impressions}</p></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top by Net New Reach */}
        <div>
          <SectionHeader title="Hvilke annonser når flest mennesker?" />
          <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
            <div className="divide-y divide-neutral-100">
              {topByReach.map((ad, i) => {
                const isExpanded = expandedAdId === `reach-${ad.id}`;
                const reachFormatted = ad.reach >= 1000000
                  ? `${(ad.reach / 1000000).toFixed(1)}M`
                  : ad.reach >= 1000
                    ? `${Math.round(ad.reach / 1000)}K`
                    : `${ad.reach}`;
                return (
                  <div key={ad.id}>
                    <div
                      className="flex items-center gap-4 px-4 py-3 hover:bg-white transition-colors cursor-pointer"
                      onClick={() => setExpandedAdId(isExpanded ? null : `reach-${ad.id}`)}
                    >
                      <span className="w-6 text-sm font-mono text-[rgba(9,10,8,0.4)]">{i + 1}</span>
                      <div className="w-10 h-10 rounded-lg bg-[rgba(9,10,8,0.06)] overflow-hidden flex-shrink-0">
                        {ad.thumbnailUrl ? (
                          <img src={ad.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-[rgba(9,10,8,0.3)]">?</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ad.name}</p>
                        <p className="text-xs text-[rgba(9,10,8,0.5)]">CPM {Math.round(ad.cpm)} kr · {ad.spend >= 1000 ? `${Math.round(ad.spend / 1000)}k` : Math.round(ad.spend)} spend</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono font-semibold">{reachFormatted}</p>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-4 pb-4 bg-white">
                        <div className="flex gap-4">
                          <div className="w-32 aspect-[9/16] rounded-lg bg-[rgba(9,10,8,0.06)] overflow-hidden flex-shrink-0">
                            {ad.thumbnailUrl ? (
                              <img src={ad.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-[rgba(9,10,8,0.3)]">{ad.format}</div>
                            )}
                          </div>
                          <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2 text-sm py-2">
                            <div><span className="text-[rgba(9,10,8,0.5)]">Reach</span><p className="font-mono font-semibold">{reachFormatted}</p></div>
                            <div><span className="text-[rgba(9,10,8,0.5)]">CPM</span><p className="font-mono font-semibold">{Math.round(ad.cpm)} kr</p></div>
                            <div><span className="text-[rgba(9,10,8,0.5)]">Spend</span><p className="font-mono font-semibold">{ad.spend >= 1000 ? `${Math.round(ad.spend / 1000)}k` : Math.round(ad.spend)}</p></div>
                            <div><span className="text-[rgba(9,10,8,0.5)]">CTR</span><p className="font-mono font-semibold">{ad.ctr.toFixed(1)}%</p></div>
                            <div><span className="text-[rgba(9,10,8,0.5)]">Frekvens</span><p className="font-mono font-semibold">{ad.impressions > 0 && ad.reach > 0 ? (ad.impressions / ad.reach).toFixed(1) : "-"}</p></div>
                            <div><span className="text-[rgba(9,10,8,0.5)]">ROAS</span><p className="font-mono font-semibold">{ad.roas?.toFixed(1) || "-"}×</p></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
