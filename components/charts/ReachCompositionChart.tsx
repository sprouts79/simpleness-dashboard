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
      <p className="font-semibold mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-[rgba(9,10,8,0.5)]">Net New</span>
          <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-link)" }}>
            {formatReach(netNew)} ({pct}%)
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-[rgba(9,10,8,0.5)]">Prev. reached</span>
          <span style={{ fontFamily: "var(--font-mono)" }}>{formatReach(prevReached)}</span>
        </div>
        <div className="flex justify-between gap-4 pt-1 border-t border-[var(--color-border)]">
          <span className="font-medium">Total reach</span>
          <span className="font-medium" style={{ fontFamily: "var(--font-mono)" }}>{formatReach(total)}</span>
        </div>
      </div>
    </div>
  );
};

export default function ReachCompositionChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 4, right: 48, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e6" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "rgba(9,10,8,0.4)", fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          yAxisId="reach"
          orientation="left"
          tick={{ fontSize: 11, fill: "rgba(9,10,8,0.4)", fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatReach}
          width={44}
        />
        <YAxis
          yAxisId="pct"
          orientation="right"
          tick={{ fontSize: 11, fill: "rgba(9,10,8,0.4)", fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}%`}
          domain={[0, 100]}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(9,10,8,0.03)" }} />

        {/* Previously reached — gray */}
        <Bar
          yAxisId="reach"
          dataKey="previouslyReached"
          stackId="reach"
          fill="#d4d4d0"
          name="Prev. reached"
          maxBarSize={32}
        />

        {/* Net New — green */}
        <Bar
          yAxisId="reach"
          dataKey="netNew"
          stackId="reach"
          fill="var(--color-green-mint)"
          name="Net New"
          maxBarSize={32}
          radius={[3, 3, 0, 0]}
        />

        {/* Net New % line — accent */}
        <Line
          yAxisId="pct"
          type="monotone"
          dataKey="netNewPct"
          stroke="#d97706"
          strokeWidth={2}
          dot={{ r: 3, fill: "#d97706", strokeWidth: 0 }}
          name="Net New %"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
