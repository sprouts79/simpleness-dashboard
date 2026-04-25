"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AdCohort } from "@/lib/types";
import { CHART_COLORS, CHART_GRID_COLOR, CHART_AXIS_COLOR } from "@/lib/chart-colors";

interface Props {
  cohorts: AdCohort[];
}

// Re-export for backwards compatibility
export const COHORT_COLORS = CHART_COLORS;

function formatSpend(v: number) {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${Math.round(v / 1000)}k`;
  return `${Math.round(v)}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  
  // Filter out zero values and sort by value descending
  const validPayload = payload
    .filter((p: any) => p.value > 0)
    .sort((a: any, b: any) => b.value - a.value);
  
  const total = validPayload.reduce((sum: number, p: any) => sum + (p.value || 0), 0);
  
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-lg px-3 py-2.5 shadow-sm min-w-[180px] max-w-[240px]">
      <p className="text-xs font-medium text-[var(--color-fg-muted)] mb-2">{label}</p>
      <div className="space-y-1 max-h-[200px] overflow-auto">
        {validPayload.slice(0, 6).map((entry: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 min-w-0">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-[var(--color-fg-muted)] truncate">{entry.name}</span>
            </div>
            <span className="text-xs font-semibold tabular-nums text-[var(--color-fg)]" style={{ fontFamily: "var(--font-mono)" }}>{formatSpend(entry.value)}</span>
          </div>
        ))}
        {validPayload.length > 6 && (
          <p className="text-xs text-[var(--color-fg-disabled)]">+{validPayload.length - 6} flere</p>
        )}
      </div>
      <div className="pt-1.5 mt-1.5 border-t border-[var(--color-border)] flex justify-between">
        <span className="text-xs text-[var(--color-fg-muted)]">Total</span>
        <span className="text-sm font-bold tabular-nums text-[var(--color-fg)]" style={{ fontFamily: "var(--font-mono)" }}>{formatSpend(total)}</span>
      </div>
    </div>
  );
};

// Legend component
function CohortLegend({ labels, colors }: { labels: string[], colors: string[] }) {
  // Show newest first (reverse order)
  const reversedLabels = [...labels].reverse();
  const reversedColors = [...colors].slice(0, labels.length).reverse();
  
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
      {reversedLabels.map((label, idx) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
            style={{ backgroundColor: reversedColors[idx] }}
          />
          <span className="text-xs text-[var(--color-fg-muted)]">{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function CohortSpendChart({ cohorts }: Props) {
  // Transform cohort data into weekly timeline
  // Each week shows how much each cohort contributed to total spend
  const { chartData, cohortLabels } = useMemo(() => {
    if (cohorts.length === 0) return { chartData: [], cohortLabels: [] };
    
    // Sort cohorts by date (oldest first)
    const sortedCohorts = [...cohorts].sort((a, b) => 
      new Date(a.cohortDate).getTime() - new Date(b.cohortDate).getTime()
    );
    
    // Get all unique week labels across cohorts
    const allWeeks: string[] = [];
    sortedCohorts.forEach(cohort => {
      const cohortStart = new Date(cohort.cohortDate);
      cohort.weeks.forEach(w => {
        const weekDate = new Date(cohortStart);
        weekDate.setDate(weekDate.getDate() + w.weekNumber * 7);
        const weekLabel = `${weekDate.toLocaleDateString("nb-NO", { day: "numeric", month: "short" })}`;
        if (!allWeeks.includes(weekLabel)) {
          allWeeks.push(weekLabel);
        }
      });
    });
    
    // Create timeline based on calendar weeks
    const now = new Date();
    const weeksToShow = 12;
    const timeline: { week: string; weekDate: Date }[] = [];
    
    for (let i = weeksToShow - 1; i >= 0; i--) {
      const weekDate = new Date(now);
      weekDate.setDate(weekDate.getDate() - i * 7);
      // Get Monday of that week
      const day = weekDate.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      weekDate.setDate(weekDate.getDate() + diff);
      
      const weekLabel = weekDate.toLocaleDateString("nb-NO", { day: "numeric", month: "short" });
      timeline.push({ week: weekLabel, weekDate });
    }
    
    // Build chart data
    const labels = sortedCohorts.map(c => c.label);
    const data = timeline.map(({ week, weekDate }) => {
      const row: Record<string, number | string> = { week };
      
      sortedCohorts.forEach((cohort, idx) => {
        const cohortStart = new Date(cohort.cohortDate);
        const weeksDiff = Math.floor((weekDate.getTime() - cohortStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
        
        // Find spend for this cohort at this relative week
        if (weeksDiff >= 0 && weeksDiff < cohort.weeks.length) {
          const weekData = cohort.weeks.find(w => w.weekNumber === weeksDiff);
          row[cohort.label] = weekData?.spend ?? 0;
        } else {
          row[cohort.label] = 0;
        }
      });
      
      return row;
    });
    
    return { chartData: data, cohortLabels: labels };
  }, [cohorts]);

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-sm text-[var(--color-fg-muted)]">
        Ingen kohort-data tilgjengelig
      </div>
    );
  }

  return (
    <div>
      <CohortLegend labels={cohortLabels} colors={COHORT_COLORS} />
      <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
        <CartesianGrid strokeDasharray="0" stroke={CHART_GRID_COLOR} vertical={false} />
        <XAxis
          dataKey="week"
          tick={{ fontSize: 11, fill: CHART_AXIS_COLOR, fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
          dy={8}
        />
        <YAxis
          tick={{ fontSize: 11, fill: CHART_AXIS_COLOR, fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatSpend}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: CHART_AXIS_COLOR, strokeDasharray: "3 3" }} />
        
        {/* Stack areas for each cohort */}
        {cohortLabels.map((label, idx) => (
          <Area
            key={label}
            type="monotone"
            dataKey={label}
            stackId="1"
            stroke={COHORT_COLORS[idx % COHORT_COLORS.length]}
            fill={COHORT_COLORS[idx % COHORT_COLORS.length]}
            fillOpacity={0.8}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
    </div>
  );
}
