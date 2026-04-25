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
import { SpendTrendPoint } from "@/lib/types";
import { CHART_BAR_COLOR, CHART_LINE_COLOR, CHART_GRID_COLOR, CHART_AXIS_COLOR } from "@/lib/chart-colors";
import { format, parseISO } from "date-fns";
import { nb } from "date-fns/locale";

interface Props {
  data: SpendTrendPoint[];
  days?: number; // kept for backwards compat but unused — chart shows all data passed in
}

function formatNok(v: number) {
  if (v >= 1000) return `${Math.round(v / 1000)}k`;
  return `${v}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const spend = payload.find((p: any) => p.dataKey === "spend")?.value;
  const roas = payload.find((p: any) => p.dataKey === "roas")?.value;
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-lg px-3 py-2.5 shadow-sm">
      <p className="text-xs font-medium text-[var(--color-fg-muted)] mb-2">{label}</p>
      <div className="flex gap-5">
        {spend !== undefined && (
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: CHART_BAR_COLOR }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-subtle)]">Spend</span>
            </div>
            <p className="font-bold text-base tabular-nums text-[var(--color-fg)]" style={{ fontFamily: "var(--font-mono)" }}>
              {spend.toLocaleString("no-NO")} kr
            </p>
          </div>
        )}
        {roas !== undefined && (
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_LINE_COLOR }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-subtle)]">ROAS</span>
            </div>
            <p className="font-bold text-base tabular-nums text-[var(--color-fg)]" style={{ fontFamily: "var(--font-mono)" }}>
              {roas.toFixed(1)}×
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function SpendTrendChart({ data }: Props) {
  const formatted = data.map((d) => ({
    ...d,
    label: format(parseISO(d.date), "d. MMM", { locale: nb }),
  }));

  // Show every Nth tick to avoid crowding
  const n = formatted.length;
  const tickInterval = n <= 7 ? 0 : n <= 30 ? 6 : n <= 90 ? 14 : 30;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <ComposedChart data={formatted} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
        <CartesianGrid strokeDasharray="0" stroke={CHART_GRID_COLOR} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: CHART_AXIS_COLOR, fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
          interval={tickInterval}
          dy={8}
        />
        <YAxis
          yAxisId="spend"
          orientation="left"
          tick={{ fontSize: 11, fill: CHART_AXIS_COLOR, fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${formatNok(v)} kr`}
          width={56}
        />
        <YAxis
          yAxisId="roas"
          orientation="right"
          tick={{ fontSize: 11, fill: CHART_AXIS_COLOR, fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v.toFixed(1)}x`}
          domain={[0, "auto"]}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
        <Bar
          yAxisId="spend"
          dataKey="spend"
          fill={CHART_BAR_COLOR}
          radius={[3, 3, 0, 0]}
          name="Spend"
          maxBarSize={24}
        />
        <Line
          yAxisId="roas"
          type="monotone"
          dataKey="roas"
          stroke={CHART_LINE_COLOR}
          strokeWidth={2}
          dot={false}
          activeDot={{ fill: CHART_LINE_COLOR, strokeWidth: 2, stroke: "#fff", r: 4 }}
          name="ROAS"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
