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
  Cell,
} from "recharts";
import { ReachCompositionPoint } from "@/lib/types";
import { CHART_BAR_COLOR, CHART_BAR_STACKED, CHART_LINE_COLOR } from "@/lib/chart-colors";

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
    <div className="bg-white border border-[var(--color-border)] rounded-xl px-4 py-3 shadow-md min-w-[200px]">
      <p className="font-semibold text-base mb-3">{label}</p>
      <div className="space-y-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: CHART_BAR_STACKED }} />
            <span className="text-xs font-semibold text-[rgba(9,10,8,0.6)]">Nye</span>
          </div>
          <p className="font-bold text-lg" style={{ fontFamily: "var(--font-mono)" }}>
            {formatReach(netNew)} <span className="text-sm font-medium text-[rgba(9,10,8,0.5)]">({pct}%)</span>
          </p>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: CHART_BAR_COLOR }} />
            <span className="text-xs font-semibold text-[rgba(9,10,8,0.6)]">Tidligere nådd</span>
          </div>
          <p className="font-bold text-lg" style={{ fontFamily: "var(--font-mono)" }}>{formatReach(prevReached)}</p>
        </div>
        <div className="pt-2 border-t border-[var(--color-border)]">
          <span className="text-sm text-[rgba(9,10,8,0.5)]">Total reach</span>
          <p className="font-bold text-lg" style={{ fontFamily: "var(--font-mono)" }}>{formatReach(total)}</p>
        </div>
      </div>
    </div>
  );
};

export default function ReachCompositionChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0de" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 13, fill: "rgba(9,10,8,0.5)", fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
          dy={8}
        />
        <YAxis
          yAxisId="reach"
          orientation="left"
          tick={{ fontSize: 13, fill: "rgba(9,10,8,0.5)", fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatReach}
          width={52}
        />
        <YAxis
          yAxisId="pct"
          orientation="right"
          tick={{ fontSize: 13, fill: "rgba(9,10,8,0.5)", fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}%`}
          domain={[0, 100]}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(9,10,8,0.03)" }} />

        {/* Previously reached — lightest beige */}
        <Bar
          yAxisId="reach"
          dataKey="previouslyReached"
          stackId="reach"
          fill={CHART_BAR_COLOR}
          name="Prev. reached"
          maxBarSize={32}
        />

        {/* Net New — third darkest (stacked) */}
        <Bar
          yAxisId="reach"
          dataKey="netNew"
          stackId="reach"
          fill={CHART_BAR_STACKED}
          name="Nye"
          maxBarSize={32}
          radius={[3, 3, 0, 0]}
        />

        {/* Net New % line — dark brown */}
        <Line
          yAxisId="pct"
          type="monotone"
          dataKey="netNewPct"
          stroke={CHART_LINE_COLOR}
          strokeWidth={3}
          dot={{ fill: CHART_LINE_COLOR, strokeWidth: 0, r: 4 }}
          activeDot={{ fill: CHART_LINE_COLOR, strokeWidth: 0, r: 5 }}
          name="Net New %"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
