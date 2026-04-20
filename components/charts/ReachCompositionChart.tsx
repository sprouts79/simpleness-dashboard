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
    <div className="bg-white border border-[var(--color-border)] rounded-lg px-3 py-2.5 shadow-sm text-xs min-w-[180px]">
      <p className="font-medium mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-[var(--color-gray-500)]">Net New</span>
          <span className="tabular-nums text-[var(--color-gray-600)]">
            {formatReach(netNew)} ({pct}%)
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-[var(--color-gray-500)]">Prev. reached</span>
          <span className="tabular-nums">{formatReach(prevReached)}</span>
        </div>
        <div className="flex justify-between gap-4 pt-1 border-t border-[var(--color-border)]">
          <span className="font-medium">Total reach</span>
          <span className="font-medium tabular-nums">{formatReach(total)}</span>
        </div>
      </div>
    </div>
  );
};

export default function ReachCompositionChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 4, right: 48, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "var(--color-gray-400)" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          yAxisId="reach"
          orientation="left"
          tick={{ fontSize: 11, fill: "var(--color-gray-400)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatReach}
          width={44}
        />
        <YAxis
          yAxisId="pct"
          orientation="right"
          tick={{ fontSize: 11, fill: "var(--color-gray-400)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}%`}
          domain={[0, 100]}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-gray-50)" }} />

        {/* Previously reached */}
        <Bar
          yAxisId="reach"
          dataKey="previouslyReached"
          stackId="reach"
          fill="var(--color-gray-200)"
          name="Prev. reached"
          maxBarSize={32}
        />

        {/* Net New */}
        <Bar
          yAxisId="reach"
          dataKey="netNew"
          stackId="reach"
          fill="var(--color-gray-400)"
          name="Net New"
          maxBarSize={32}
          radius={[3, 3, 0, 0]}
        />

        {/* Net New % line */}
        <Line
          yAxisId="pct"
          type="monotone"
          dataKey="netNewPct"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={{ r: 3, fill: "#f59e0b", strokeWidth: 0 }}
          name="Net New %"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
