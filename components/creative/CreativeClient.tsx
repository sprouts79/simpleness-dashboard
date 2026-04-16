"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import SectionHeader from "@/components/ui/SectionHeader";
import CohortTable from "@/components/creative/CohortTable";
import AdGallery from "@/components/creative/AdGallery";
import { Ad, AdCohort, CreativeChurnPoint, CohortMetric } from "@/lib/types";
import clsx from "clsx";

const COHORT_COLORS = [
  "#89FF58", "#515B12", "#41BD0E", "#DFF7CC",
  "#d97706", "#7c3aed", "#0ea5e9", "#ec4899",
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
    return b.spend - a.spend; // default: spend
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
    .sort((a, b) => b[0].localeCompare(a[0])) // newest cohort first
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
}: {
  clientId: string;
  ads: Ad[];
  cohorts: AdCohort[];
  churnData: CreativeChurnPoint[];
}) {
  const router = useRouter();
  const [metric, setMetric] = useState<CohortMetric>("hookRate");
  const [view, setView] = useState<View>("tabell");
  const [gallerySort, setGallerySort] = useState<GallerySort>("spend");
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

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
        setSyncStatus(`Synkronisert — ${json.cohortSynced} ukerader`);
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

  const totalSpend = cohorts.reduce((s, c) => s + c.weeks.reduce((ws, w) => ws + w.spend, 0), 0);
  const cohortGroups = groupByCohort(ads, gallerySort);

  // Build spend-per-cohort data for chart (oldest → newest for chronological order)
  const cohortSpendData = [...cohorts].reverse().map((c, i) => ({
    label: c.label,
    spend: c.weeks.reduce((s, w) => s + w.spend, 0),
    adCount: c.adCount,
    color: COHORT_COLORS[i % COHORT_COLORS.length],
  }));

  return (
    <div className="space-y-8">
      {/* Cohort spend chart */}
      {cohorts.length > 0 && (
        <div>
          <SectionHeader
            title="Spend per kohort"
            subtitle={`NOK ${Math.round(totalSpend / 1000)}k totalt · ${cohorts.length} kohorter`}
          />
          <div className="rounded-xl border border-[var(--color-border)] p-5 bg-white">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={cohortSpendData} margin={{ top: 4, right: 12, bottom: 0, left: 0 }} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e6" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "rgba(9,10,8,0.4)", fontFamily: "var(--font-mono)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "rgba(9,10,8,0.4)", fontFamily: "var(--font-mono)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                  width={40}
                />
                <Tooltip
                  cursor={{ fill: "rgba(9,10,8,0.03)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white border border-[var(--color-border)] rounded-lg px-3 py-2 shadow-sm text-xs">
                        <p className="font-semibold mb-1">{d.label}</p>
                        <p style={{ fontFamily: "var(--font-mono)" }}>NOK {Math.round(d.spend).toLocaleString("no-NO")}</p>
                        <p className="text-[rgba(9,10,8,0.4)]">{d.adCount} annonser</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="spend" radius={[4, 4, 0, 0]}>
                  {cohortSpendData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* View + controls header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[rgba(9,10,8,0.45)] uppercase tracking-widest">
            {view === "galleri" ? "Annonse-galleri" : "Kohort-ytelse · siste 12 uker"}
          </h2>
          {view === "tabell" && (
            <p className="text-xs text-[rgba(9,10,8,0.4)] mt-0.5">
              Rader = lanserings­uke · Kolonner = uker siden lansering · Grønn/rød = over/under median per kolonne
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-[var(--color-surface)] rounded-lg p-1 gap-1">
            {(["galleri", "tabell"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={clsx(
                  "text-xs font-semibold px-3 py-1.5 rounded-md transition-colors capitalize",
                  view === v
                    ? "bg-white text-[var(--color-black)] shadow-sm"
                    : "text-[rgba(9,10,8,0.45)] hover:text-[var(--color-black)]"
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
              className="text-xs font-semibold bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-black)] cursor-pointer"
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
              className="text-xs font-semibold bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-black)] cursor-pointer"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>Sorter: {s.label}</option>
              ))}
            </select>
          )}

          {/* Sync button */}
          <div className="flex items-center gap-2">
            {syncStatus && (
              <span className="text-xs text-[rgba(9,10,8,0.45)]">{syncStatus}</span>
            )}
            <button
              onClick={handleSync}
              disabled={syncing}
              className={clsx(
                "text-xs font-semibold px-4 py-2 rounded-lg transition-colors",
                syncing
                  ? "bg-[var(--color-surface)] text-[rgba(9,10,8,0.35)] cursor-not-allowed border border-[var(--color-border)]"
                  : "bg-[var(--color-accent)] text-[var(--color-black)] hover:opacity-90"
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
          <p className="text-sm text-[rgba(9,10,8,0.4)]">Ingen kohortdata tilgjengelig.</p>
        )
      ) : ads.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] p-12 text-center">
          <p className="text-sm text-[rgba(9,10,8,0.4)]">Ingen annonsedata tilgjengelig.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {cohortGroups.map(({ key, label, ads: cohortAds }) => (
            <div key={key}>
              <div className="flex items-baseline gap-3 mb-4">
                <h3 className="text-sm font-semibold capitalize">{label}</h3>
                <span className="text-xs text-[rgba(9,10,8,0.35)]">
                  {cohortAds.filter((a) => a.status === "active").length} aktive ·{" "}
                  {cohortAds.length} totalt
                </span>
              </div>
              <AdGallery ads={cohortAds} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
