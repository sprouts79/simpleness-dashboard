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

// Get color based on value relative to min/max (for heatmap)
function getHeatmapColor(value: number, min: number, max: number, higherIsBetter: boolean): string {
  if (max === min) return "rgba(9,10,8,0.06)";
  const normalized = (value - min) / (max - min);
  const adjusted = higherIsBetter ? normalized : 1 - normalized;
  
  // Interpolate from red (bad) to green (good)
  const r = Math.round(200 - (200 - 34) * adjusted);
  const g = Math.round(50 + (140 - 50) * adjusted);
  const b = Math.round(50 - (50 - 34) * adjusted);
  
  return `rgba(${r}, ${g}, ${b}, 0.2)`;
}

function getHeatmapTextColor(value: number, min: number, max: number, higherIsBetter: boolean): string {
  if (max === min) return "rgba(9,10,8,0.6)";
  const normalized = (value - min) / (max - min);
  const adjusted = higherIsBetter ? normalized : 1 - normalized;
  
  const r = Math.round((200 - (200 - 34) * adjusted) * 0.6);
  const g = Math.round((50 + (140 - 50) * adjusted) * 0.6);
  const b = Math.round((50 - (50 - 34) * adjusted) * 0.6);
  
  return `rgb(${r}, ${g}, ${b})`;
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

  // Calculate week columns (W0 to W7)
  const weekColumns = [0, 1, 2, 3, 4, 5, 6, 7];

  // Calculate min/max for each week column for heatmap
  const weekMinMax = useMemo(() => {
    const result: Record<number, { min: number; max: number }> = {};
    weekColumns.forEach(weekNum => {
      const values = cohorts
        .map(c => c.weeks.find(w => w.weekNumber === weekNum))
        .filter(Boolean)
        .map(w => w![metric] ?? 0);
      result[weekNum] = {
        min: values.length > 0 ? Math.min(...values) : 0,
        max: values.length > 0 ? Math.max(...values) : 0,
      };
    });
    return result;
  }, [cohorts, metric]);

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

  // Group ads by cohort
  const adsByCohort = useMemo(() => {
    const grouped: Record<string, Ad[]> = {};
    cohorts.forEach(c => {
      grouped[c.cohortDate] = ads.filter(ad => {
        const adMonth = ad.cohortDate?.substring(0, 7);
        return adMonth === c.cohortDate?.substring(0, 7);
      });
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
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
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

      {/* Cohort Cards */}
      {cohorts.length > 0 && (
        <div>
          <SectionHeader
            title="Kohorter"
            subtitle="Annonser gruppert etter lanseringsuke - klikk for a se alle annonser"
          />
          <div className="space-y-4">
            {cohorts.map((cohort) => {
              const totalSpend = cohort.weeks.reduce((s, w) => s + (w.spend ?? 0), 0);
              const cohortAds = adsByCohort[cohort.cohortDate] || [];
              const isExpanded = expandedCohort === cohort.cohortDate;
              const w0 = cohort.weeks.find(w => w.weekNumber === 0);
              const latestWeek = cohort.weeks.reduce((latest, w) => 
                (w.spend ?? 0) > 0 && w.weekNumber > (latest?.weekNumber ?? -1) ? w : latest, 
                null as typeof cohort.weeks[0] | null
              );
              
              // Calculate fatigue (change from W0 to latest)
              const startValue = w0?.[metric] ?? 0;
              const currentValue = latestWeek?.[metric] ?? 0;
              const change = startValue > 0 ? ((currentValue - startValue) / startValue) * 100 : 0;
              
              return (
                <div 
                  key={cohort.cohortDate}
                  className={clsx(
                    "rounded-xl bg-[var(--color-surface)] overflow-hidden transition-all",
                    isExpanded && "ring-2 ring-[var(--color-black)]"
                  )}
                >
                  {/* Card header - always visible */}
                  <div 
                    className="p-5 cursor-pointer hover:bg-white transition-colors"
                    onClick={() => setExpandedCohort(isExpanded ? null : cohort.cohortDate)}
                  >
                    <div className="flex items-start gap-5">
                      {/* Thumbnails preview */}
                      <div className="flex -space-x-2 flex-shrink-0">
                        {cohortAds.slice(0, 4).map((ad, i) => (
                          <div 
                            key={ad.id}
                            className="w-12 h-12 rounded-lg bg-[rgba(9,10,8,0.1)] border-2 border-[var(--color-surface)] overflow-hidden"
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
                            className="w-12 h-12 rounded-lg bg-[rgba(9,10,8,0.08)] border-2 border-[var(--color-surface)] flex items-center justify-center text-xs font-medium text-[rgba(9,10,8,0.5)]"
                            style={{ zIndex: 0 }}
                          >
                            +{cohortAds.length - 4}
                          </div>
                        )}
                      </div>
                      
                      {/* Cohort info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-base font-semibold">{cohort.label}</h3>
                          <span className="text-sm text-[rgba(9,10,8,0.5)]">
                            {cohort.adCount} annonser
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-mono">
                            <span className="text-[rgba(9,10,8,0.5)]">Spend:</span>{" "}
                            <span className="font-semibold">{totalSpend >= 1000 ? `${Math.round(totalSpend / 1000)}k` : totalSpend}</span>
                          </span>
                          <span className="font-mono">
                            <span className="text-[rgba(9,10,8,0.5)]">{selectedMetricInfo.label}:</span>{" "}
                            <span className="font-semibold">{formatValue(currentValue, metric)}{selectedMetricInfo.unit !== "kr" ? selectedMetricInfo.unit : ""}</span>
                          </span>
                          {change !== 0 && (
                            <span 
                              className={clsx(
                                "text-xs font-semibold px-2 py-0.5 rounded",
                                (selectedMetricInfo.higherIsBetter ? change >= 0 : change <= 0)
                                  ? "bg-[rgba(34,140,34,0.12)] text-[#228b22]"
                                  : "bg-[rgba(200,50,50,0.12)] text-[#c83232]"
                              )}
                            >
                              {change > 0 ? "+" : ""}{change.toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Expand indicator */}
                      <div className="text-[rgba(9,10,8,0.3)] text-lg">
                        {isExpanded ? "−" : "+"}
                      </div>
                    </div>
                    
                    {/* Mini heatmap row */}
                    <div className="flex items-center gap-1 mt-4">
                      <span className="text-xs text-[rgba(9,10,8,0.4)] w-8">W0</span>
                      {weekColumns.map(weekNum => {
                        const weekData = cohort.weeks.find(w => w.weekNumber === weekNum);
                        const value = weekData?.[metric] ?? 0;
                        const { min, max } = weekMinMax[weekNum];
                        const hasData = weekData && value > 0;
                        
                        return (
                          <div 
                            key={weekNum}
                            className="flex-1 h-2 rounded-full"
                            style={{
                              backgroundColor: hasData 
                                ? getHeatmapColor(value, min, max, selectedMetricInfo.higherIsBetter)
                                : "rgba(9,10,8,0.06)"
                            }}
                          />
                        );
                      })}
                      <span className="text-xs text-[rgba(9,10,8,0.4)] w-8 text-right">W7</span>
                    </div>
                  </div>
                  
                  {/* Expanded gallery */}
                  {isExpanded && cohortAds.length > 0 && (
                    <div className="px-5 pb-5 border-t border-[var(--color-border)] pt-4">
                      <div className="grid grid-cols-6 gap-4">
                        {cohortAds.map((ad) => (
                          <div key={ad.id} className="group/ad">
                            <div className="aspect-square rounded-lg bg-[rgba(9,10,8,0.06)] overflow-hidden mb-2">
                              {ad.thumbnailUrl ? (
                                <img
                                  src={ad.thumbnailUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-[rgba(9,10,8,0.3)]">
                                  {ad.format}
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-[rgba(9,10,8,0.7)] truncate font-medium">{ad.name}</p>
                            <p className="text-xs font-mono text-[rgba(9,10,8,0.45)]">
                              {ad.spend >= 1000 ? `${Math.round(ad.spend / 1000)}k` : ad.spend} · {ad.ctr.toFixed(1)}%
                            </p>
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
                      {ad.spend >= 1000 ? `${Math.round(ad.spend / 1000)}k` : ad.spend}
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
                    <p className="text-xs text-[rgba(9,10,8,0.5)]">CTR {ad.ctr.toFixed(1)}% · {ad.spend >= 1000 ? `${Math.round(ad.spend / 1000)}k` : ad.spend} spend</p>
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
