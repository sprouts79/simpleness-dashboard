"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { AdLabRow } from "@/lib/types";
import { CHART_COLORS, CHART_GRID_COLOR, CHART_AXIS_COLOR } from "@/lib/chart-colors";

interface Props {
  ads: AdLabRow[];
  metric: "spend" | "spend_share" | "purchases" | "roas";
}

function formatSpend(v: number) {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${Math.round(v / 1000)}k`;
  return `${Math.round(v)}`;
}

interface CohortBucket {
  cohortDate: string;
  label: string;
  ads: AdLabRow[];
  color: string;
}

function buildCohortBuckets(ads: AdLabRow[]): CohortBucket[] {
  const map = new Map<string, AdLabRow[]>();
  for (const ad of ads) {
    if (!map.has(ad.cohortDate)) map.set(ad.cohortDate, []);
    map.get(ad.cohortDate)!.push(ad);
  }
  const sortedKeys = Array.from(map.keys()).sort();
  return sortedKeys.map((cohortDate, i) => ({
    cohortDate,
    label: map.get(cohortDate)![0].cohortLabel,
    ads: map.get(cohortDate)!,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));
}

export default function CohortLifecycleChart({ ads, metric }: Props) {
  const buckets = useMemo(() => buildCohortBuckets(ads), [ads]);

  const chartData = useMemo(() => {
    if (buckets.length === 0) return [];
    let maxWeek = 0;
    for (const b of buckets)
      for (const ad of b.ads)
        if (ad.weeks.length > maxWeek) maxWeek = ad.weeks.length;

    const rows: Record<string, number | string>[] = [];
    for (let weekIdx = 0; weekIdx < maxWeek; weekIdx++) {
      const row: Record<string, number | string> = { week: `U${weekIdx}` };

      // Compute total per-week-since-launch across all ads, used for spend share
      let weekTotal = 0;
      for (const b of buckets) {
        for (const ad of b.ads) {
          const sorted = [...ad.weeks].sort((a, b) => a.weekStart.localeCompare(b.weekStart));
          const w = sorted[weekIdx];
          if (w) weekTotal += w.spend;
        }
      }

      for (const b of buckets) {
        let cohortSpend = 0;
        let cohortPurchases = 0;
        let cohortPurchaseValue = 0;
        let activeAds = 0;
        for (const ad of b.ads) {
          const sorted = [...ad.weeks].sort((a, b) => a.weekStart.localeCompare(b.weekStart));
          const w = sorted[weekIdx];
          if (w) {
            cohortSpend += w.spend;
            cohortPurchases += w.purchases;
            cohortPurchaseValue += w.purchaseValue;
            activeAds += 1;
          }
        }
        if (metric === "spend") {
          row[b.label] = activeAds > 0 ? cohortSpend / activeAds : 0; // avg per active ad
        } else if (metric === "spend_share") {
          row[b.label] = weekTotal > 0 ? (cohortSpend / weekTotal) * 100 : 0;
        } else if (metric === "purchases") {
          row[b.label] = activeAds > 0 ? cohortPurchases / activeAds : 0;
        } else {
          row[b.label] = cohortSpend > 0 ? cohortPurchaseValue / cohortSpend : 0;
        }
      }
      rows.push(row);
    }
    return rows;
  }, [buckets, metric]);

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-sm text-neutral-500">
        Ingen kohort-data å vise.
      </div>
    );
  }

  function tickFormat(v: number): string {
    if (metric === "roas") return `${v.toFixed(1)}x`;
    if (metric === "spend_share") return `${Math.round(v)}%`;
    if (metric === "purchases") return v.toFixed(1);
    return formatSpend(v);
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
          <CartesianGrid strokeDasharray="0" stroke={CHART_GRID_COLOR} vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11, fill: CHART_AXIS_COLOR, fontFamily: "var(--font-mono)" }}
            tickLine={false}
            axisLine={false}
            dy={8}
          />
          <YAxis
            tick={{ fontSize: 11, fill: CHART_AXIS_COLOR, fontFamily: "var(--font-mono)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={tickFormat}
            width={56}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
              fontSize: 12,
            }}
            formatter={(v: number) => tickFormat(v)}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            iconType="circle"
            iconSize={8}
          />
          {buckets.map((b) => (
            <Line
              key={b.cohortDate}
              type="monotone"
              dataKey={b.label}
              stroke={b.color}
              strokeWidth={2}
              dot={{ r: 2.5 }}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-neutral-500 mt-2">
        {buckets.length} kohorter sammenlignet. X-akse: uker siden hver annonses første spend.
      </p>
    </div>
  );
}
