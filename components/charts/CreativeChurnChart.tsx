"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CreativeChurnPoint } from "@/lib/types";
import { CHART_COLORS, CHART_GRID_COLOR, CHART_AXIS_COLOR } from "@/lib/chart-colors";

interface Props {
  data: CreativeChurnPoint[];
  cohortLabels: string[];
}

// Use shared brown/earth color palette
const COHORT_COLORS = CHART_COLORS;

function formatNok(v: number) {
  if (v >= 1000) return `${Math.round(v / 1000)}k`;
  return `${v}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s: number, p: any) => s + (p.value || 0), 0);
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-lg px-3 py-2.5 shadow-sm text-xs min-w-[180px]">
      <p className="text-xs font-medium text-[var(--color-fg-muted)] mb-2">{label}</p>
      <div className="space-y-0.5">
        {[...payload].reverse().map((p: any) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ background: p.fill }} />
              <span className="text-[var(--color-fg-muted)]">{p.dataKey}</span>
            </span>
            <span className="tabular-nums text-[var(--color-fg)]" style={{ fontFamily: "var(--font-mono)" }}>NOK {formatNok(p.value)}</span>
          </div>
        ))}
        <div className="flex justify-between gap-4 pt-1.5 mt-1 border-t border-[var(--color-border)]">
          <span className="font-medium">Total</span>
          <span className="font-semibold tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>NOK {formatNok(total)}</span>
        </div>
      </div>
    </div>
  );
};

export default function CreativeChurnChart({ data, cohortLabels }: Props) {
  return (
    <div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
        {[...cohortLabels].reverse().map((label, idx) => {
          const colorIdx = cohortLabels.length - 1 - idx;
          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: COHORT_COLORS[colorIdx % COHORT_COLORS.length] }}
              />
              <span className="text-xs text-[var(--color-fg-muted)]">{label}</span>
            </div>
          );
        })}
      </div>
      <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="0" stroke={CHART_GRID_COLOR} vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: CHART_AXIS_COLOR, fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: CHART_AXIS_COLOR, fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatNok}
          width={44}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
        {cohortLabels.map((label, i) => (
          <Area
            key={label}
            type="monotone"
            dataKey={label}
            stackId="spend"
            stroke={COHORT_COLORS[i % COHORT_COLORS.length]}
            fill={COHORT_COLORS[i % COHORT_COLORS.length]}
            fillOpacity={0.85}
            strokeWidth={0}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
    </div>
  );
}
