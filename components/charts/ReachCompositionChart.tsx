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
    <div className="card px-4 py-3 text-sm min-w-[180px]">
      <p className="font-display font-semibold text-navy mb-3">{label}</p>
      <div className="space-y-2">
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">Net New</span>
          <span className="tabular-nums font-medium text-navy">
            {formatReach(netNew)} ({pct}%)
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">Prev. reached</span>
          <span className="tabular-nums text-gray-600">{formatReach(prevReached)}</span>
        </div>
        <div className="flex justify-between gap-4 pt-2 border-t border-gray-200">
          <span className="font-semibold text-navy">Total reach</span>
          <span className="font-semibold tabular-nums text-navy">{formatReach(total)}</span>
        </div>
      </div>
    </div>
  );
};

export default function ReachCompositionChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 8, right: 48, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: "#6c757d" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          yAxisId="reach"
          orientation="left"
          tick={{ fontSize: 12, fill: "#6c757d" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatReach}
          width={48}
        />
        <YAxis
          yAxisId="pct"
          orientation="right"
          tick={{ fontSize: 12, fill: "#6c757d" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}%`}
          domain={[0, 100]}
          width={44}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8f9fa" }} />

        {/* Previously reached */}
        <Bar
          yAxisId="reach"
          dataKey="previouslyReached"
          stackId="reach"
          fill="#e9ecef"
          name="Prev. reached"
          maxBarSize={36}
        />

        {/* Net New */}
        <Bar
          yAxisId="reach"
          dataKey="netNew"
          stackId="reach"
          fill="#4a9ba5"
          name="Net New"
          maxBarSize={36}
          radius={[4, 4, 0, 0]}
        />

        {/* Net New % line */}
        <Line
          yAxisId="pct"
          type="monotone"
          dataKey="netNewPct"
          stroke="#1e3a5f"
          strokeWidth={2.5}
          dot={{ r: 4, fill: "#1e3a5f", strokeWidth: 0 }}
          name="Net New %"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
