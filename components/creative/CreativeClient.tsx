"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import SectionHeader from "@/components/ui/SectionHeader";
import KpiCard from "@/components/ui/KpiCard";
import CohortTable from "@/components/creative/CohortTable";
import TopAdsList from "@/components/creative/TopAdsList";
import { Ad, AdCohort, CreativeChurnPoint, CohortMetric } from "@/lib/types";
import clsx from "clsx";

// Cohort colors - distinguishable but harmonious
const COHORT_COLORS = [
  "#41BD0E", "#515B12", "#0ea5e9", "#d97706",
  "#7c3aed", "#ec4899", "#14b8a6", "#f97316",
];

type CohortMetricKey = CohortMetric;

const METRIC_OPTIONS: { value: CohortMetricKey; label: string; unit: string }[] = [
  { value: "ctr", label: "CTR", unit: "%" },
  { value: "hookRate", label: "Hook Rate", unit: "%" },
  { value: "holdRate", label: "Hold Rate", unit: "%" },
  { value: "cpm", label: "CPM", unit: "kr" },
  { value: "cpa", label: "CPA", unit: "kr" },
  { value: "roas", label: "ROAS", unit: "x" },
];

function formatCohortLabel(yearMonth: string): string {
  if (!yearMonth || yearMonth === "unknown") return "Ukjent";
  const [year, month] = yearMonth.split("-");
  const monthNames = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];
  return `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`;
}

// Calculate fatigue: how much performance drops from W0 to W4
function calculateFatigue(cohort: AdCohort, metric: CohortMetricKey): number | null {
  const w0 = cohort.weeks.find(w => w.weekNumber === 0);
  const w4 = cohort.weeks.find(w => w.weekNumber === 4);
  if (!w0 || !w4) return null;
  
  const v0 = w0[metric] ?? 0;
  const v4 = w4[metric] ?? 0;
  if (v0 === 0) return null;
  
  // For metrics where lower is better (cpm, cpa), invert the calculation
  if (metric === "cpm" || metric === "cpa") {
    return ((v4 - v0) / v0) * 100; // Positive = worse (higher cost)
  }
  return ((v4 - v0) / v0) * 100; // Negative = worse (lower performance)
}

// Get cohort health status
function getCohortHealth(fatigue: number | null, metric: CohortMetricKey): { level: "good" | "warning" | "critical"; label: string } {
  if (fatigue === null) return { level: "warning", label: "Utilstrekkelig data" };
  
  // For cost metrics, positive fatigue is bad
  const isGoodIfNegative = metric === "cpm" || metric === "cpa";
  const adjustedFatigue = isGoodIfNegative ? fatigue : -fatigue;
  
  if (adjustedFatigue <= 10) return { level: "good", label: "Stabil" };
  if (adjustedFatigue <= 30) return { level: "warning", label: "Moderat fall" };
  return { level: "critical", label: "Hoy fatigue" };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FatigueTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-xl px-4 py-3 shadow-md min-w-[180px]">
      <p className="font-semibold text-sm mb-2">Uke {label}</p>
      <div className="space-y-1.5">
        {payload.map((p: { name: string; value: number; color: string }, i: number) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
              {p.name}
            </span>
            <span className="font-mono text-sm font-medium">{p.value?.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

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
  const [metric, setMetric] = useState<CohortMetricKey>("ctr");
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [expandedCohort, setExpandedCohort] = useState<string | null>(null);

  // Build fatigue curve data - shows how each cohort's metric changes over weeks
  const fatigueCurveData = useMemo(() => {
    if (cohorts.length === 0) return [];
    
    const weekNumbers = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    return weekNumbers.map(weekNum => {
      const point: Record<string, number | string> = { week: `W${weekNum}` };
      cohorts.slice(0, 5).forEach((cohort) => { // Show top 5 cohorts
        const weekData = cohort.weeks.find(w => w.weekNumber === weekNum);
        if (weekData) {
          point[cohort.label] = weekData[metric] ?? 0;
        }
      });
      return point;
    });
  }, [cohorts, metric]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    if (cohorts.length === 0) return null;
    
    const activeAds = ads.filter(a => a.status === "active").length;
    const totalAds = ads.length;
    
    // Average fatigue across cohorts
    const fatigueValues = cohorts
      .map(c => calculateFatigue(c, metric))
      .filter((f): f is number => f !== null);
    const avgFatigue = fatigueValues.length > 0 
      ? fatigueValues.reduce((a, b) => a + b, 0) / fatigueValues.length 
      : 0;
    
    // Average lifespan (weeks where cohort still has spend)
    const lifespans = cohorts.map(c => c.weeks.filter(w => (w.spend ?? 0) > 0).length);
    const avgLifespan = lifespans.length > 0 
      ? lifespans.reduce((a, b) => a + b, 0) / lifespans.length 
      : 0;
    
    return {
      activeAds,
      totalAds,
      activeCohorts: cohorts.filter(c => c.weeks.some(w => w.weekNumber <= 4 && (w.spend ?? 0) > 0)).length,
      avgFatigue: Math.abs(avgFatigue),
      avgLifespan: Math.round(avgLifespan),
    };
  }, [cohorts, ads, metric]);

  // Group ads by cohort for the cohort cards
  const cohortCards = useMemo(() => {
    return cohorts.slice(0, 6).map((cohort, index) => {
      const cohortAds = ads.filter(ad => {
        const adMonth = ad.cohortDate?.substring(0, 7);
        return adMonth === cohort.cohortDate?.substring(0, 7);
      });
      
      const fatigue = calculateFatigue(cohort, metric);
      const health = getCohortHealth(fatigue, metric);
      const w0 = cohort.weeks.find(w => w.weekNumber === 0);
      const latestWeek = cohort.weeks.reduce((max, w) => 
        (w.spend ?? 0) > 0 && w.weekNumber > max.weekNumber ? w : max, 
        cohort.weeks[0] || { weekNumber: 0 }
      );
      
      return {
        ...cohort,
        ads: cohortAds.slice(0, 6), // Show up to 6 ad thumbnails
        totalAds: cohortAds.length,
        color: COHORT_COLORS[index % COHORT_COLORS.length],
        fatigue,
        health,
        w0Value: w0?.[metric] ?? 0,
        currentValue: latestWeek?.[metric as keyof typeof latestWeek] ?? 0,
        currentWeek: latestWeek?.weekNumber ?? 0,
        totalSpend: cohort.weeks.reduce((s, w) => s + (w.spend ?? 0), 0),
      };
    });
  }, [cohorts, ads, metric]);

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

  const selectedMetricInfo = METRIC_OPTIONS.find(m => m.value === metric);

  return (
    <div className="space-y-10">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as CohortMetricKey)}
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
      {kpis && (
        <div className="grid grid-cols-4 gap-4">
          <KpiCard
            label="Aktive annonser"
            value={`${kpis.activeAds} / ${kpis.totalAds}`}
          />
          <KpiCard
            label="Aktive kohorter"
            value={String(kpis.activeCohorts)}
          />
          <KpiCard
            label="Snitt levetid"
            value={`${kpis.avgLifespan} uker`}
          />
          <KpiCard
            label={`Snitt ${selectedMetricInfo?.label} fall`}
            value={`${kpis.avgFatigue.toFixed(0)}%`}
            status={
              kpis.avgFatigue < 20 
                ? { level: "good", label: "Sunt" }
                : kpis.avgFatigue < 40 
                  ? { level: "warning", label: "Moderat" }
                  : { level: "critical", label: "Hoy fatigue" }
            }
          />
        </div>
      )}

      {/* Fatigue Curve Chart */}
      {fatigueCurveData.length > 0 && cohorts.length > 0 && (
        <div>
          <SectionHeader
            title={`${selectedMetricInfo?.label} over tid per kohort`}
            subtitle="Hvordan ytelsen utvikler seg uke for uke etter lansering"
          />
          <div className="rounded-xl bg-[var(--color-surface)] p-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={fatigueCurveData} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0de" vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 13, fill: "rgba(9,10,8,0.5)", fontFamily: "var(--font-mono)" }}
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                />
                <YAxis
                  tick={{ fontSize: 13, fill: "rgba(9,10,8,0.5)", fontFamily: "var(--font-mono)" }}
                  tickLine={false}
                  axisLine={false}
                  width={52}
                  tickFormatter={(v) => `${v}${selectedMetricInfo?.unit === "%" ? "%" : ""}`}
                />
                <Tooltip content={<FatigueTooltip />} cursor={{ stroke: "rgba(9,10,8,0.06)" }} />
                <Legend 
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span className="text-sm text-[rgba(9,10,8,0.6)]">{value}</span>}
                />
                {cohorts.slice(0, 5).map((cohort, i) => (
                  <Line
                    key={cohort.label}
                    type="monotone"
                    dataKey={cohort.label}
                    stroke={COHORT_COLORS[i % COHORT_COLORS.length]}
                    strokeWidth={3}
                    dot={{ fill: COHORT_COLORS[i % COHORT_COLORS.length], strokeWidth: 0, r: 4 }}
                    activeDot={{ fill: COHORT_COLORS[i % COHORT_COLORS.length], strokeWidth: 0, r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Cohort Cards */}
      {cohortCards.length > 0 && (
        <div>
          <SectionHeader
            title="Kohorter"
            subtitle="Hver kohort er en gruppe annonser lansert sammen"
          />
          <div className="grid grid-cols-2 gap-4">
            {cohortCards.map((cohort) => (
              <div
                key={cohort.cohortDate}
                className={clsx(
                  "rounded-xl bg-[var(--color-surface)] p-5 transition-all cursor-pointer",
                  expandedCohort === cohort.cohortDate ? "ring-2 ring-[var(--color-black)]" : "hover:bg-white"
                )}
                onClick={() => setExpandedCohort(
                  expandedCohort === cohort.cohortDate ? null : cohort.cohortDate
                )}
              >
                {/* Cohort header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span 
                      className="w-3 h-3 rounded-full"
                      style={{ background: cohort.color }}
                    />
                    <div>
                      <h3 className="font-semibold text-base">{cohort.label}</h3>
                      <p className="text-sm text-[rgba(9,10,8,0.5)]">
                        {cohort.totalAds} annonser · {Math.round(cohort.totalSpend / 1000)}k spend
                      </p>
                    </div>
                  </div>
                  <span
                    className={clsx(
                      "inline-flex items-center gap-1.5 text-xs",
                      {
                        "text-[#3d8a12]": cohort.health.level === "good",
                        "text-[#9a7010]": cohort.health.level === "warning",
                        "text-[#9a4c4c]": cohort.health.level === "critical",
                      }
                    )}
                  >
                    <span
                      className={clsx("w-1.5 h-1.5 rounded-full", {
                        "bg-[#3d8a12]": cohort.health.level === "good",
                        "bg-[#b47814]": cohort.health.level === "warning",
                        "bg-[#b45c5c]": cohort.health.level === "critical",
                      })}
                    />
                    {cohort.health.label}
                  </span>
                </div>

                {/* Metrics row */}
                <div className="flex gap-6 mb-4">
                  <div>
                    <p className="text-xs text-[rgba(9,10,8,0.5)] mb-0.5">W0 {selectedMetricInfo?.label}</p>
                    <p className="font-mono font-semibold">
                      {cohort.w0Value.toFixed(1)}{selectedMetricInfo?.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[rgba(9,10,8,0.5)] mb-0.5">W{cohort.currentWeek} {selectedMetricInfo?.label}</p>
                    <p className="font-mono font-semibold">
                      {(cohort.currentValue as number).toFixed(1)}{selectedMetricInfo?.unit}
                    </p>
                  </div>
                  {cohort.fatigue !== null && (
                    <div>
                      <p className="text-xs text-[rgba(9,10,8,0.5)] mb-0.5">Endring</p>
                      <p className={clsx(
                        "font-mono font-semibold",
                        cohort.fatigue > 0 
                          ? (metric === "cpm" || metric === "cpa" ? "text-[#9a4c4c]" : "text-[#3d8a12]")
                          : (metric === "cpm" || metric === "cpa" ? "text-[#3d8a12]" : "text-[#9a4c4c]")
                      )}>
                        {cohort.fatigue > 0 ? "+" : ""}{cohort.fatigue.toFixed(0)}%
                      </p>
                    </div>
                  )}
                </div>

                {/* Ad thumbnails */}
                {cohort.ads.length > 0 && (
                  <div className="flex gap-2">
                    {cohort.ads.map((ad) => (
                      <div
                        key={ad.id}
                        className="w-12 h-12 rounded-lg bg-[rgba(9,10,8,0.08)] overflow-hidden flex-shrink-0"
                      >
                        {ad.thumbnailUrl ? (
                          <img
                            src={ad.thumbnailUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-[rgba(9,10,8,0.3)]">
                            ?
                          </div>
                        )}
                      </div>
                    ))}
                    {cohort.totalAds > 6 && (
                      <div className="w-12 h-12 rounded-lg bg-[rgba(9,10,8,0.06)] flex items-center justify-center text-xs text-[rgba(9,10,8,0.5)]">
                        +{cohort.totalAds - 6}
                      </div>
                    )}
                  </div>
                )}

                {/* Expanded view */}
                {expandedCohort === cohort.cohortDate && (
                  <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                    <p className="text-sm text-[rgba(9,10,8,0.6)] mb-3">
                      Ukentlig {selectedMetricInfo?.label}:
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {cohort.weeks.slice(0, 8).map((week) => (
                        <div key={week.weekNumber} className="text-center">
                          <p className="text-xs text-[rgba(9,10,8,0.4)] mb-1">W{week.weekNumber}</p>
                          <p className="font-mono text-sm font-medium">
                            {(week[metric] ?? 0).toFixed(1)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Cohort Table */}
      {cohorts.length > 0 && (
        <div>
          <SectionHeader
            title="Detaljert kohort-tabell"
            subtitle="Alle kohorter med ukentlig ytelse - gronn/rod viser over/under median"
          />
          <CohortTable cohorts={cohorts} metric={metric} />
        </div>
      )}

      {/* Topp 10 annonser */}
      {(topWeek.length > 0 || topMonth.length > 0 || topQuarter.length > 0) && (
        <div>
          <SectionHeader
            title="Topp 10 annonser"
            subtitle="De best presterende annonsene etter valgt periode og metrikk"
          />
          <TopAdsList topWeek={topWeek} topMonth={topMonth} topQuarter={topQuarter} />
        </div>
      )}
    </div>
  );
}
