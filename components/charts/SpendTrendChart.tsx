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
  Legend,
} from "recharts";
import { SpendTrendPoint } from "@/lib/types";
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
    <div className="bg-white border border-[var(--color-border)] rounded-xl px-4 py-3 shadow-md">
      <p className="font-semibold text-base mb-3">{label}</p>
      <div className="flex gap-5">
        {spend !== undefined && (
          <div>
            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-surface)] text-[rgba(9,10,8,0.6)] mb-1">
              Spend
            </span>
            <p className="font-bold text-xl" style={{ fontFamily: "var(--font-mono)" }}>
              {spend.toLocaleString("no-NO")} kr
            </p>
          </div>
        )}
        {roas !== undefined && (
          <div>
            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-surface)] text-[rgba(9,10,8,0.6)] mb-1">
              ROAS
            </span>
            <p className="font-bold text-xl" style={{ fontFamily: "var(--font-mono)" }}>
              {roas.toFixed(1)}x
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
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={formatted} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0de" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 13, fill: "rgba(9,10,8,0.5)", fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
          interval={tickInterval}
          dy={8}
        />
        <YAxis
          yAxisId="spend"
          orientation="left"
          tick={{ fontSize: 13, fill: "rgba(9,10,8,0.5)", fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${formatNok(v)} kr`}
          width={56}
        />
        <YAxis
          yAxisId="roas"
          orientation="right"
          tick={{ fontSize: 13, fill: "rgba(9,10,8,0.5)", fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v.toFixed(1)}x`}
          domain={[0, "auto"]}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(9,10,8,0.03)" }} />
        <Bar
          yAxisId="spend"
          dataKey="spend"
          fill="rgba(9,10,8,0.15)"
          radius={[3, 3, 0, 0]}
          name="Spend"
          maxBarSize={28}
        />
        <Line
          yAxisId="roas"
          type="monotone"
          dataKey="roas"
          stroke="var(--color-link)"
          strokeWidth={3}
          dot={false}
          activeDot={false}
          name="ROAS"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
