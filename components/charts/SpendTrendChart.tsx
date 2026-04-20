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
import { format, parseISO } from "date-fns";
import { nb } from "date-fns/locale";

interface Props {
  data: SpendTrendPoint[];
  days?: number;
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
      <p className="font-medium mb-1">{label}</p>
      {spend !== undefined && (
        <p>
          Spend:{" "}
          <span className="tabular-nums">
            NOK {spend.toLocaleString("no-NO")}
          </span>
        </p>
      )}
      {roas !== undefined && (
        <p>
          ROAS:{" "}
          <span className="tabular-nums">{roas.toFixed(2)}x</span>
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

  const n = formatted.length;
  const tickInterval = n <= 7 ? 0 : n <= 30 ? 6 : n <= 90 ? 14 : 30;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={formatted} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "var(--color-gray-400)" }}
          tickLine={false}
          axisLine={false}
          interval={tickInterval}
        />
        <YAxis
          yAxisId="spend"
          orientation="left"
          tick={{ fontSize: 11, fill: "var(--color-gray-400)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatNok}
          width={40}
        />
        <YAxis
          yAxisId="roas"
          orientation="right"
          tick={{ fontSize: 11, fill: "var(--color-gray-400)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v.toFixed(1)}x`}
          domain={[0, "auto"]}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-gray-50)" }} />
        <Bar
          yAxisId="spend"
          dataKey="spend"
          fill="var(--color-gray-200)"
          radius={[2, 2, 0, 0]}
          name="Spend"
          maxBarSize={24}
        />
        <Line
          yAxisId="roas"
          type="monotone"
          dataKey="roas"
          stroke="var(--color-black)"
          strokeWidth={2}
          dot={false}
          name="ROAS"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
