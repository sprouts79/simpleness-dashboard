"use client";

import { useState } from "react";
import SectionHeader from "@/components/ui/SectionHeader";
import CreativeChurnChart from "@/components/charts/CreativeChurnChart";
import CohortTable from "@/components/creative/CohortTable";
import AdGallery from "@/components/creative/AdGallery";
import { Ad, AdCohort, CreativeChurnPoint, CohortMetric } from "@/lib/types";
import clsx from "clsx";

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
  ads,
  cohorts,
  churnData,
}: {
  ads: Ad[];
  cohorts: AdCohort[];
  churnData: CreativeChurnPoint[];
}) {
  const [metric, setMetric] = useState<CohortMetric>("hookRate");
  const [view, setView] = useState<View>("galleri");
  const [gallerySort, setGallerySort] = useState<GallerySort>("spend");

  const cohortLabels = cohorts.map((c) => c.label);
  const totalSpend = cohorts.reduce((s, c) => s + c.weeks.reduce((ws, w) => ws + w.spend, 0), 0);
  const cohortGroups = groupByCohort(ads, gallerySort);

  return (
    <div className="space-y-8">
      {/* Creative Churn chart — only show if cohort data exists */}
      {cohorts.length > 0 && (
        <div>
          <SectionHeader
            title="Creative Churn"
            subtitle={`NOK ${Math.round(totalSpend / 1000)}k totalt · ${cohorts.length} kohorter · Spend fordelt per kreativ-kohort`}
          />
          <div className="rounded-xl border border-[var(--color-border)] p-5 bg-white">
            <CreativeChurnChart data={churnData} cohortLabels={cohortLabels} />
            <div className="flex flex-wrap gap-3 mt-4">
              {cohorts.map((c, i) => {
                const colors = [
                  "#89FF58", "#515B12", "#41BD0E", "#DFF7CC",
                  "#d97706", "#7c3aed", "#0ea5e9", "#ec4899",
                ];
                return (
                  <span key={c.label} className="flex items-center gap-1.5 text-xs text-[rgba(9,10,8,0.5)]">
                    <span
                      className="w-2.5 h-2.5 rounded-sm inline-block"
                      style={{ background: colors[i % colors.length] }}
                    />
                    {c.label} ({c.adCount} ads)
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* View + controls header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[rgba(9,10,8,0.45)] uppercase tracking-widest">
            {view === "galleri" ? "Annonse-galleri" : "Kohort-ytelse"}
          </h2>
          {view === "tabell" && (
            <p className="text-xs text-[rgba(9,10,8,0.4)] mt-0.5">
              Grønn = over median · Rød = under median · Per kolonne (uke)
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
