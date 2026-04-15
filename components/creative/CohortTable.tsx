"use client";

import { AdCohort, CohortMetric } from "@/lib/types";
import clsx from "clsx";

interface Props {
  cohorts: AdCohort[];
  metric: CohortMetric;
}

function getCellValue(week: AdCohort["weeks"][0], metric: CohortMetric): number {
  switch (metric) {
    case "hookRate": return week.hookRate;
    case "holdRate": return week.holdRate;
    case "ctr": return week.ctr;
    case "cpm": return week.cpm;
    case "cpa": return week.cpa;
    case "roas": return week.roas;
    case "spend": return week.spend;
  }
}

function formatCell(value: number, metric: CohortMetric): string {
  switch (metric) {
    case "hookRate":
    case "holdRate":
    case "ctr":
      return `${value.toFixed(1)}%`;
    case "cpm":
      return `${Math.round(value)} kr`;
    case "cpa":
      return `${Math.round(value)} kr`;
    case "roas":
      return `${value.toFixed(1)}×`;
    case "spend":
      return value >= 1000 ? `${Math.round(value / 1000)}k` : `${Math.round(value)}`;
  }
}

// Higher is better for all except cpm and cpa
function isHigherBetter(metric: CohortMetric): boolean {
  return !["cpm", "cpa"].includes(metric);
}

export default function CohortTable({ cohorts, metric }: Props) {
  // Find max weeks across all cohorts
  const maxWeeks = Math.max(...cohorts.map((c) => c.weeks.length), 0);
  const weekCols = Array.from({ length: maxWeeks }, (_, i) => i);

  // Compute per-column median for heatmap
  const colMedians: number[] = weekCols.map((w) => {
    const vals = cohorts
      .map((c) => c.weeks[w])
      .filter(Boolean)
      .map((week) => getCellValue(week, metric));
    if (!vals.length) return 0;
    const sorted = [...vals].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  });

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
      <table className="text-sm w-full">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
            <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-[rgba(9,10,8,0.45)] whitespace-nowrap">
              Kohort
            </th>
            <th className="text-center px-3 py-3 text-xs font-semibold uppercase tracking-widest text-[rgba(9,10,8,0.45)]">
              Ads
            </th>
            {weekCols.map((w) => (
              <th
                key={w}
                className="text-center px-3 py-3 text-xs font-semibold uppercase tracking-widest text-[rgba(9,10,8,0.45)] whitespace-nowrap"
              >
                W{w}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohorts.map((cohort) => (
            <tr
              key={cohort.cohortDate}
              className="border-b border-[var(--color-border)] last:border-0"
            >
              <td className="px-5 py-2.5 font-medium whitespace-nowrap">{cohort.label}</td>
              <td className="px-3 py-2.5 text-center text-xs text-[rgba(9,10,8,0.5)]">
                {cohort.adCount}
              </td>
              {weekCols.map((w) => {
                const weekData = cohort.weeks[w];
                if (!weekData) {
                  return (
                    <td key={w} className="px-3 py-2.5 text-center">
                      <span className="text-[rgba(9,10,8,0.15)] text-xs">—</span>
                    </td>
                  );
                }
                const val = getCellValue(weekData, metric);
                const median = colMedians[w];
                const aboveMedian = isHigherBetter(metric) ? val >= median : val <= median;

                return (
                  <td key={w} className="px-2 py-1.5 text-center">
                    <span
                      className={clsx(
                        "inline-block px-2 py-1 rounded text-xs font-medium",
                        aboveMedian
                          ? "bg-green-100 text-green-800"
                          : "bg-red-50 text-red-700"
                      )}
                      style={{ fontFamily: "var(--font-mono)", minWidth: 52 }}
                    >
                      {formatCell(val, metric)}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
