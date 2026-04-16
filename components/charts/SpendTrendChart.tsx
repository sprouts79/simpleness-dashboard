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
    <div className="bg-white border border-[var(--color-border)] rounded-lg px-3 py-2 shadow-sm text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {spend !== undefined && (
        <p>
          Spend:{" "}
          <span style={{ fontFamily: "var(--font-mono)" }}>
            NOK {spend.toLocaleString("no-NO")}
          </span>
        </p>
      )}
      {roas !== undefined && (
        <p>
          ROAS:{" "}
          <span style={{ fontFamily: "var(--font-mono)" }}>{roas.toFixed(2)}×</span>
        </p>
      )}
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
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={formatted} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e6" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "rgba(9,10,8,0.4)", fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
          interval={tickInterval}
        />
        <YAxis
          yAxisId="spend"
          orientation="left"
          tick={{ fontSize: 11, fill: "rgba(9,10,8,0.4)", fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatNok}
          width={40}
        />
        <YAxis
          yAxisId="roas"
          orientation="right"
          tick={{ fontSize: 11, fill: "rgba(9,10,8,0.4)", fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v.toFixed(1)}×`}
          domain={[0, "auto"]}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(9,10,8,0.03)" }} />
        <Bar
          yAxisId="spend"
          dataKey="spend"
          fill="#e8e8e6"
          radius={[2, 2, 0, 0]}
          name="Spend"
          maxBarSize={24}
        />
        <Line
          yAxisId="roas"
          type="monotone"
          dataKey="roas"
          stroke="var(--color-link)"
          strokeWidth={2}
          dot={false}
          name="ROAS"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
