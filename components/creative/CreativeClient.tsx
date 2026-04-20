"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import SectionHeader from "@/components/ui/SectionHeader";
import CohortTable from "@/components/creative/CohortTable";
import AdGallery from "@/components/creative/AdGallery";
import TopAdsList from "@/components/creative/TopAdsList";
import InfoBox from "@/components/ui/InfoBox";
import { Ad, AdCohort, CreativeChurnPoint, CohortMetric } from "@/lib/types";
import clsx from "clsx";

const COHORT_COLORS = [
  "#1e3a5f", "#2d4a6f", "#4a9ba5", "#5fb5bf",
  "#adb5bd", "#dee2e6", "#e9ecef", "#f1f3f5",
];

type GallerySort = "spend" | "roas" | "ctr" | "hookRate";
type View = "galleri" | "tabell";

const METRIC_OPTIONS: { value: CohortMetric; label: string }[] = [
  { value: "hookRate", label: "Hook Rate" },
  { value: "holdRate", label: "Hold Rate" },
  { value: "ctr", label: "CTR" },
  { value: "cpm", label: "CPM" },
  { value: "cpa", label: "CPA" },
  { value: "roas", label: "ROAS" },
  { value: "spend", label: "Spend" },
];

const SORT_OPTIONS: { value: GallerySort; label: string }[] = [
  { value: "spend", label: "Spend" },
  { value: "roas", label: "ROAS" },
  { value: "ctr", label: "CTR" },
  { value: "hookRate", label: "Hook Rate" },
];

function formatCohortLabel(yearMonth: string): string {
  if (!yearMonth || yearMonth === "unknown") return "Ukjent";
  const [year, month] = yearMonth.split("-");
  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("no-NO", {
    month: "short",
    year: "numeric",
  });
}

function sortAds(ads: Ad[], sortBy: GallerySort): Ad[] {
  return [...ads].sort((a, b) => {
    if (sortBy === "roas") return b.roas - a.roas;
    if (sortBy === "ctr") return b.ctr - a.ctr;
    if (sortBy === "hookRate") return b.hookRate - a.hookRate;
    return b.spend - a.spend;
  });
}

function groupByCohort(
  ads: Ad[],
  sortBy: GallerySort
): { key: string; label: string; ads: Ad[] }[] {
  const groups = new Map<string, Ad[]>();

  for (const ad of ads) {
    const key = ad.cohortDate ? ad.cohortDate.substring(0, 7) : "unknown";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(ad);
  }

  return Array.from(groups.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, cohortAds]) => ({
      key,
      label: formatCohortLabel(key),
      ads: sortAds(cohortAds, sortBy),
    }));
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
  const [metric, setMetric] = useState<CohortMetric>("spend");
  const [view, setView] = useState<View>("tabell");
  const [gallerySort, setGallerySort] = useState<GallerySort>("spend");
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  async function handleSync() {
    setSyncing(true);
    setSyncStatus(null);
    const syncType = view === "galleri" ? "ads" : "cohort";
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, syncType }),
      });
      const json = await res.json();
      if (json.ok) {
        const label = syncType === "ads"
          ? `Synkronisert - ${json.adsSynced} annonser`
          : `Synkronisert - ${json.cohortSynced} ukerader`;
        setSyncStatus(label);
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

  const cohortGroups = groupByCohort(ads, gallerySort);

  const cohortKeysOldestFirst = [...cohorts].reverse().map((c) => c.label);
  const totalChurnSpend = churnData.reduce((s, p) =>
    s + cohortKeysOldestFirst.reduce((cs, k) => cs + ((p[k] as number) ?? 0), 0), 0);

  return (
    <div className="space-y-12">
      {/* Stacked spend-by-cohort chart */}
      {churnData.length > 0 && (
        <div>
          <SectionHeader
            title="Spend per kohort over tid"
            subtitle={`NOK ${Math.round(totalChurnSpend / 1000)}k totalt - ${cohorts.length} kohorter - siste 12 uker`}
          />
          <div className="card p-6">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={churnData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#6c757d" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6c757d" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                  width={48}
                />
                <Tooltip
                  cursor={{ stroke: "#e9ecef" }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const total = payload.reduce((s, p) => s + ((p.value as number) ?? 0), 0);
                    return (
                      <div className="card px-4 py-3 text-sm max-w-[220px]">
                        <p className="font-display font-semibold text-navy mb-2">{label}</p>
                        {[...payload].reverse().map((p, i) => (
                          (p.value as number) > 0 && (
                            <div key={i} className="flex items-center gap-2 mb-1">
                              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.fill }} />
                              <span className="text-gray-500 truncate">{p.dataKey}</span>
                              <span className="ml-auto tabular-nums pl-2 text-navy">
                                {Math.round(p.value as number).toLocaleString("no-NO")}
                              </span>
                            </div>
                          )
                        ))}
                        <div className="border-t border-gray-200 mt-2 pt-2 font-semibold tabular-nums text-navy">
                          NOK {Math.round(total).toLocaleString("no-NO")}
                        </div>
                      </div>
                    );
                  }}
                />
                {cohortKeysOldestFirst.map((key, i) => (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stackId="a"
                    stroke={COHORT_COLORS[i % COHORT_COLORS.length]}
                    fill={COHORT_COLORS[i % COHORT_COLORS.length]}
                    fillOpacity={0.85}
                    strokeWidth={0}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-5">
              {cohortKeysOldestFirst.map((key, i) => (
                <span key={key} className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="w-3 h-3 rounded flex-shrink-0" style={{ background: COHORT_COLORS[i % COHORT_COLORS.length] }} />
                  {key}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* View + controls header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-navy">
            {view === "galleri" ? "Annonse-galleri" : "Kohort-ytelse"}
          </h2>
          {view === "tabell" && (
            <p className="text-sm text-gray-500 mt-1">
              Rader = lanseringsuke - Kolonner = uker siden lansering
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex bg-gray-100 p-1 rounded-full gap-1">
            {(["galleri", "tabell"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={clsx(
                  "text-sm font-medium px-4 py-2 rounded-full transition-all capitalize",
                  view === v
                    ? "bg-white text-navy shadow-sm"
                    : "text-gray-500 hover:text-navy"
                )}
              >
                {v}
              </button>
            ))}
          </div>

          {view === "tabell" && (
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as CohortMetric)}
              className="text-sm font-medium bg-white border border-gray-200 rounded-full px-4 py-2 text-navy cursor-pointer"
            >
              {METRIC_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          )}

          {view === "galleri" && (
            <select
              value={gallerySort}
              onChange={(e) => setGallerySort(e.target.value as GallerySort)}
              className="text-sm font-medium bg-white border border-gray-200 rounded-full px-4 py-2 text-navy cursor-pointer"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>Sorter: {s.label}</option>
              ))}
            </select>
          )}

          {/* Sync button */}
          <div className="flex items-center gap-3">
            {syncStatus && (
              <span className="text-sm text-gray-500">{syncStatus}</span>
            )}
            <button
              onClick={handleSync}
              disabled={syncing}
              className={clsx(
                "btn-pill",
                syncing
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "btn-pill-primary"
              )}
            >
              {syncing ? "Henter..." : "Hent data"}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {view === "tabell" ? (
        cohorts.length > 0 ? (
          <CohortTable cohorts={cohorts} metric={metric} />
        ) : (
          <p className="text-sm text-gray-400">Ingen kohortdata tilgjengelig.</p>
        )
      ) : ads.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-gray-600">Ingen annonsedata tilgjengelig.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {cohortGroups.map(({ key, label, ads: cohortAds }) => (
            <div key={key}>
              <div className="flex items-baseline gap-4 mb-5">
                <h3 className="font-display text-lg font-semibold text-navy capitalize">{label}</h3>
                <span className="text-sm text-gray-500">
                  {cohortAds.filter((a) => a.status === "active").length} aktive -{" "}
                  {cohortAds.length} totalt
                </span>
              </div>
              <AdGallery ads={cohortAds} />
            </div>
          ))}
        </div>
      )}

      {/* Top 10 ads */}
      {(topWeek.length > 0 || topMonth.length > 0 || topQuarter.length > 0) && (
        <div>
          <SectionHeader
            title="Topp 10 annonser"
            subtitle="Sortert etter valgt metrikk - velg periode og metrikk"
          />
          <TopAdsList topWeek={topWeek} topMonth={topMonth} topQuarter={topQuarter} />
        </div>
      )}

      {/* Info */}
      <InfoBox title="Hvordan lese denne rapporten">
        {view === "tabell" ? (
          <div className="space-y-3 text-gray-600">
            <p>
              Hver rad er en <span className="font-semibold text-navy">kohort</span> - alle annonser som fikk spend for forste gang i den uken.
              Kolonnene viser ytelse uke for uke etter lansering: W0 = lanseringsuka, W1 = uka etter, osv.
            </p>
            <p>
              <span className="font-semibold text-navy">Hva du ser etter:</span> Annonser med hoy Hook Rate i W0 fanger oppmerksomhet tidlig.
              Se om ytelsen holder seg (W1, W2) eller faller raskt - det forteller deg levetiden pa kreativet.
            </p>
          </div>
        ) : (
          <div className="space-y-3 text-gray-600">
            <p>
              Hvert farget band i grafen representerer en <span className="font-semibold text-navy">kreativ kohort</span> - alle annonser som
              forste gang ble vist i en bestemt uke. Hoyden pa bandet viser hvor mye den kohorten bruker over tid.
            </p>
            <p>
              <span className="font-semibold text-navy">Hva du ser etter:</span> Sunne kontoer viser jevnlige nye kohorter (nye farger dukker opp),
              mens eldre kohorter gradvis fases ut.
            </p>
          </div>
        )}
      </InfoBox>
    </div>
  );
}
