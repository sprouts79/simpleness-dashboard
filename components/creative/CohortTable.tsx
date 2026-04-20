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
  // Find max week number across all cohorts (each week has a .week property)
  const maxWeekNum = cohorts.reduce((max, c) =>
    c.weeks.reduce((m, w) => Math.max(m, w.week), max), -1);
  const weekCols = maxWeekNum >= 0 ? Array.from({ length: maxWeekNum + 1 }, (_, i) => i) : [];

  // Look up a week by its number (dense array, so use .find)
  function getWeek(cohort: AdCohort, weekNum: number) {
    return cohort.weeks.find((w) => w.week === weekNum);
  }

  // Compute per-column median for heatmap
  const colMedians: number[] = weekCols.map((w) => {
    const vals = cohorts
      .map((c) => getWeek(c, w))
      .filter(Boolean)
      .map((week) => getCellValue(week!, metric));
    if (!vals.length) return 0;
    const sorted = [...vals].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  });

  // Build ALL COHORTS aggregate row: impression-weighted for rates, summed for spend/purchases
  const allCohortWeeks: (AdCohort["weeks"][0] | undefined)[] = weekCols.map((w) => {
    const weekSlice = cohorts.map((c) => getWeek(c, w)).filter(Boolean) as AdCohort["weeks"];
    if (!weekSlice.length) return undefined;
    const spend = weekSlice.reduce((s, wd) => s + wd.spend, 0);
    const impressions = weekSlice.reduce((s, wd) => s + wd.impressions, 0);
    const hookRate = impressions > 0 ? weekSlice.reduce((s, wd) => s + wd.hookRate * wd.impressions, 0) / impressions : 0;
    const holdRate = impressions > 0 ? weekSlice.reduce((s, wd) => s + wd.holdRate * wd.impressions, 0) / impressions : 0;
    const ctr = impressions > 0 ? weekSlice.reduce((s, wd) => s + wd.ctr * wd.impressions, 0) / impressions : 0;
    const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
    const cpa = weekSlice.filter((wd) => wd.cpa > 0).reduce((s, wd) => s + wd.cpa, 0) / (weekSlice.filter((wd) => wd.cpa > 0).length || 1);
    const roas = weekSlice.filter((wd) => wd.roas > 0).reduce((s, wd) => s + wd.roas, 0) / (weekSlice.filter((wd) => wd.roas > 0).length || 1);
    return { week: w, spend, impressions, hookRate, holdRate, ctr, cpm, cpa, roas };
  });
  const totalAdCount = cohorts.reduce((s, c) => s + c.adCount, 0);

  return (
    <div className="overflow-x-auto rounded-xl bg-[var(--color-surface)]">
      <table className="text-sm w-full">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            <th className="text-left px-5 py-3.5 text-sm font-medium text-[rgba(9,10,8,0.5)] whitespace-nowrap">
              Kohort
            </th>
            <th className="text-center px-4 py-3.5 text-sm font-medium text-[rgba(9,10,8,0.5)]">
              Ads
            </th>
            {weekCols.map((w) => (
              <th
                key={w}
                className="text-center px-4 py-3.5 text-sm font-medium text-[rgba(9,10,8,0.5)] whitespace-nowrap"
              >
                Uke {w}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohorts.map((cohort) => (
            <tr
              key={cohort.cohortDate}
              className="border-b border-[var(--color-border)] hover:bg-white transition-colors"
            >
              <td className="px-5 py-3 font-medium whitespace-nowrap">{cohort.label}</td>
              <td className="px-4 py-3 text-center text-sm text-[rgba(9,10,8,0.5)]">
                {cohort.adCount}
              </td>
              {weekCols.map((w) => {
                const weekData = getWeek(cohort, w);
                if (!weekData) {
                  return (
                    <td key={w} className="px-4 py-3 text-center">
                      <span className="text-[rgba(9,10,8,0.25)]">-</span>
                    </td>
                  );
                }
                const val = getCellValue(weekData, metric);
                const median = colMedians[w];
                const aboveMedian = isHigherBetter(metric) ? val >= median : val <= median;

                return (
                  <td key={w} className="px-3 py-2.5 text-center">
                    <span
                      className={clsx(
                        "inline-block px-2 py-1 rounded text-sm",
                        aboveMedian
                          ? "bg-[var(--color-black)] text-white font-medium"
                          : "text-[rgba(9,10,8,0.5)]"
                      )}
                      style={{ fontFamily: "var(--font-mono)", minWidth: 56 }}
                    >
                      {formatCell(val, metric)}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}

          {/* ALL COHORTS aggregate row */}
          <tr className="border-t-2 border-[var(--color-border)] bg-white">
            <td className="px-5 py-3 font-semibold whitespace-nowrap text-sm text-[rgba(9,10,8,0.6)]">
              Alle kohorter
            </td>
            <td className="px-4 py-3 text-center text-sm font-semibold text-[rgba(9,10,8,0.5)]">
              {totalAdCount}
            </td>
            {weekCols.map((w) => {
              const wd = allCohortWeeks[w];
              if (!wd) {
                return (
                  <td key={w} className="px-4 py-3 text-center">
                    <span className="text-[rgba(9,10,8,0.25)]">-</span>
                  </td>
                );
              }
              return (
                <td key={w} className="px-3 py-2.5 text-center">
                  <span
                    className="inline-block px-2 py-1 rounded text-sm font-semibold text-[var(--color-black)]"
                    style={{ fontFamily: "var(--font-mono)", minWidth: 56 }}
                  >
                    {formatCell(getCellValue(wd, metric), metric)}
                  </span>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
