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
    <div className="card px-4 py-3 text-sm">
      <p className="font-display font-semibold text-navy mb-2">{label}</p>
      {spend !== undefined && (
        <p className="text-gray-600">
          Spend:{" "}
          <span className="tabular-nums font-medium text-navy">
            NOK {spend.toLocaleString("no-NO")}
          </span>
        </p>
      )}
      {roas !== undefined && (
        <p className="text-gray-600">
          ROAS:{" "}
          <span className="tabular-nums font-medium text-navy">{roas.toFixed(2)}x</span>
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
    <ResponsiveContainer width="100%" height={240}>
      <ComposedChart data={formatted} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: "#6c757d" }}
          tickLine={false}
          axisLine={false}
          interval={tickInterval}
        />
        <YAxis
          yAxisId="spend"
          orientation="left"
          tick={{ fontSize: 12, fill: "#6c757d" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatNok}
          width={44}
        />
        <YAxis
          yAxisId="roas"
          orientation="right"
          tick={{ fontSize: 12, fill: "#6c757d" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v.toFixed(1)}x`}
          domain={[0, "auto"]}
          width={44}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8f9fa" }} />
        <Bar
          yAxisId="spend"
          dataKey="spend"
          fill="#e8f4f5"
          stroke="#4a9ba5"
          strokeWidth={1}
          radius={[4, 4, 0, 0]}
          name="Spend"
          maxBarSize={28}
        />
        <Line
          yAxisId="roas"
          type="monotone"
          dataKey="roas"
          stroke="#1e3a5f"
          strokeWidth={2.5}
          dot={false}
          name="ROAS"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
