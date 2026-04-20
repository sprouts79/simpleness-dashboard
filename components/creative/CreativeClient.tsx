"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import SectionHeader from "@/components/ui/SectionHeader";
import KpiCard from "@/components/ui/KpiCard";
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
    const avgCtr = ads.length > 0 
      ? ads.reduce((sum, a) => sum + a.ctr, 0) / ads.length 
      : 0;
    
    return { activeAds, activeCohorts, totalSpend, avgCtr };
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

  // Top 12 by spend
  const topBySpend = useMemo(() => 
    [...ads].sort((a, b) => b.spend - a.spend).slice(0, 12),
  [ads]);

  // Top 12 by reach (using impressions as proxy since we don't have reach per ad)
  const topByReach = useMemo(() => 
    [...ads].sort((a, b) => b.impressions - a.impressions).slice(0, 12),
  [ads]);

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
      {/* Header with sync button */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-4">
          {syncStatus && (
            <span className="text-sm text-[rgba(9,10,8,0.55)]">{syncStatus}</span>
          )}
          <button
            onClick={handleSync}
            disabled={syncing}
            className={clsx(
              "text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors",
              syncing
                ? "bg-[var(--color-surface)] text-[rgba(9,10,8,0.45)] cursor-not-allowed border border-[var(--color-border)]"
                : "bg-[#89FF58] text-[var(--color-black)] hover:opacity-90"
            )}
          >
            {syncing ? "Henter..." : "Oppdater"}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Aktive annonser" value={String(kpis.activeAds)} />
        <KpiCard label="Aktive kohorter" value={String(kpis.activeCohorts)} />
        <KpiCard label="Total Spend" value={`${Math.round(kpis.totalSpend / 1000)}k`} />
        <KpiCard label="Snitt CTR" value={`${kpis.avgCtr.toFixed(1)}%`} />
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
            {cohorts.map((cohort) => {
              const totalSpend = cohort.weeks.reduce((s, w) => s + (w.spend ?? 0), 0);
              const cohortAds = adsByCohort[cohort.cohortDate] || [];
              const isExpanded = expandedCohort === cohort.cohortDate;
              
              return (
                <div 
                  key={cohort.cohortDate}
                  className={clsx(
                    "rounded-xl bg-[var(--color-surface)] overflow-hidden transition-all",
                    isExpanded && "ring-2 ring-[var(--color-black)]"
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
            })}
          </div>
        </div>
      )}

      {/* Top 12 Lists */}
      <div className="grid grid-cols-2 gap-6">
        {/* Top by Spend */}
        <div>
          <SectionHeader title="Topp 12 etter Spend" />
          <div className="rounded-xl bg-[var(--color-surface)] overflow-hidden">
            <div className="divide-y divide-[var(--color-border)]">
              {topBySpend.map((ad, i) => (
                <div key={ad.id} className="flex items-center gap-4 px-4 py-3 hover:bg-white transition-colors">
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
                    <p className="text-xs text-[rgba(9,10,8,0.5)]">CTR {ad.ctr.toFixed(1)}% · ROAS {ad.roas.toFixed(1)}x</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-semibold">
                      {ad.spend >= 1000 ? `${Math.round(ad.spend / 1000)}k` : Math.round(ad.spend)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top by Reach/Impressions */}
        <div>
          <SectionHeader title="Topp 12 etter Rekkevidde" />
          <div className="rounded-xl bg-[var(--color-surface)] overflow-hidden">
            <div className="divide-y divide-[var(--color-border)]">
              {topByReach.map((ad, i) => (
                <div key={ad.id} className="flex items-center gap-4 px-4 py-3 hover:bg-white transition-colors">
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
                    <p className="text-xs text-[rgba(9,10,8,0.5)]">CTR {ad.ctr.toFixed(1)}% · {ad.spend >= 1000 ? `${Math.round(ad.spend / 1000)}k` : Math.round(ad.spend)} spend</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-semibold">
                      {ad.impressions >= 1000000 
                        ? `${(ad.impressions / 1000000).toFixed(1)}M` 
                        : ad.impressions >= 1000 
                          ? `${Math.round(ad.impressions / 1000)}k` 
                          : ad.impressions}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
