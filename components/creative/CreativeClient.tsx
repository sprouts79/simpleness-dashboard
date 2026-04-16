"use client";

import { useState } from "react";
import SectionHeader from "@/components/ui/SectionHeader";
import CreativeChurnChart from "@/components/charts/CreativeChurnChart";
import CohortTable from "@/components/creative/CohortTable";
import AdGallery from "@/components/creative/AdGallery";
import { Ad, AdCohort, CreativeChurnPoint, CohortMetric } from "@/lib/types";
import clsx from "clsx";

type GallerySort = "hookRate" | "spend" | "roas" | "ctr";
type View = "tabell" | "galleri";

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
  { value: "hookRate", label: "Hook Rate" },
  { value: "spend", label: "Spend" },
  { value: "roas", label: "ROAS" },
  { value: "ctr", label: "CTR" },
];

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

      {/* Cohort table / Ad gallery */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-[rgba(9,10,8,0.45)] uppercase tracking-widest">
              {view === "tabell" ? "Kohort-ytelse" : "Annonse-galleri"}
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
              {(["tabell", "galleri"] as View[]).map((v) => (
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

            {/* Metric selector (only in table view) */}
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

            {/* Sort selector (only in gallery view) */}
            {view === "galleri" && ads.length > 0 && (
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

        {view === "tabell" ? (
          cohorts.length > 0 ? (
            <CohortTable cohorts={cohorts} metric={metric} />
          ) : (
            <p className="text-sm text-[rgba(9,10,8,0.4)]">Ingen kohortdata tilgjengelig.</p>
          )
        ) : (
          ads.length > 0 ? (
            <AdGallery ads={ads} sortBy={gallerySort} />
          ) : (
            <div className="rounded-xl border border-[var(--color-border)] p-12 text-center">
              <p className="text-sm text-[rgba(9,10,8,0.4)]">
                Ingen annonsedata tilgjengelig.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
