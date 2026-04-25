"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ReachCompositionPoint } from "@/lib/types";
import { CHART_BAR_COLOR, CHART_BAR_STACKED, CHART_LINE_COLOR, CHART_GRID_COLOR, CHART_AXIS_COLOR } from "@/lib/chart-colors";

interface Props {
  data: ReachCompositionPoint[];
}

function formatReach(v: number) {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${Math.round(v / 1000)}K`;
  return `${v}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const prevReached = payload.find((p: any) => p.dataKey === "previouslyReached")?.value ?? 0;
  const netNew = payload.find((p: any) => p.dataKey === "netNew")?.value ?? 0;
  const pct = payload.find((p: any) => p.dataKey === "netNewPct")?.value ?? 0;
  const total = prevReached + netNew;
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-lg px-3 py-2.5 shadow-sm min-w-[200px]">
      <p className="text-xs font-medium text-[var(--color-fg-muted)] mb-2">{label}</p>
      <div className="space-y-2">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: CHART_BAR_STACKED }} />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-subtle)]">Nye</span>
          </div>
          <p className="font-bold text-base tabular-nums text-[var(--color-fg)]" style={{ fontFamily: "var(--font-mono)" }}>
            {formatReach(netNew)} <span className="text-xs font-medium text-[var(--color-fg-muted)]">({pct} %)</span>
          </p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: CHART_BAR_COLOR }} />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-subtle)]">Tidligere nådd</span>
          </div>
          <p className="font-bold text-base tabular-nums text-[var(--color-fg)]" style={{ fontFamily: "var(--font-mono)" }}>{formatReach(prevReached)}</p>
        </div>
        <div className="pt-2 border-t border-[var(--color-border)]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-subtle)]">Total reach</span>
          <p className="font-bold text-base tabular-nums text-[var(--color-fg)] mt-0.5" style={{ fontFamily: "var(--font-mono)" }}>{formatReach(total)}</p>
        </div>
      </div>
    </div>
  );
};

export default function ReachCompositionChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
        <CartesianGrid strokeDasharray="0" stroke={CHART_GRID_COLOR} vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: CHART_AXIS_COLOR, fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
          dy={8}
        />
        <YAxis
          yAxisId="reach"
          orientation="left"
          tick={{ fontSize: 11, fill: CHART_AXIS_COLOR, fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatReach}
          width={52}
        />
        <YAxis
          yAxisId="pct"
          orientation="right"
          tick={{ fontSize: 11, fill: CHART_AXIS_COLOR, fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}%`}
          domain={[0, 100]}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />

        {/* Previously reached — primær grønn (deep) */}
        <Bar
          yAxisId="reach"
          dataKey="previouslyReached"
          stackId="reach"
          fill={CHART_BAR_COLOR}
          name="Prev. reached"
          maxBarSize={28}
        />

        {/* Net New — mint stacked */}
        <Bar
          yAxisId="reach"
          dataKey="netNew"
          stackId="reach"
          fill={CHART_BAR_STACKED}
          name="Nye"
          maxBarSize={28}
          radius={[3, 3, 0, 0]}
        />

        {/* Net New % line — deep grønn */}
        <Line
          yAxisId="pct"
          type="monotone"
          dataKey="netNewPct"
          stroke={CHART_LINE_COLOR}
          strokeWidth={2}
          dot={false}
          activeDot={{ fill: CHART_LINE_COLOR, strokeWidth: 2, stroke: "#fff", r: 4 }}
          name="Net New %"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
