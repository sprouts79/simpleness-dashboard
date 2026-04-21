export const dynamic = "force-dynamic";

import { getClient } from "@/lib/db";
import { fetchReach } from "@/lib/meta-api";
import ReachClient from "@/components/reach/ReachClient";
import { MonthlyReachRow } from "@/lib/types";

/**
 * Reach metrics — matches the reference app (Ad Insights) methodology:
 *
 * Rolling Reach = fetchReach(periodStart, monthEnd)  — always from period start
 * Monthly Reach = fetchReach(monthStart, monthEnd)   — this month only
 *
 * Net New (no lookback):
 *   = Rolling[n] - Rolling[n-1]  — incremental to the cumulative
 *
 * Net New (with lookback, SLIDING per month):
 *   windowStart = monthStart - lookbackDays
 *   full = fetchReach(windowStart, monthEnd)     — lookback + this month
 *   prev = fetchReach(windowStart, monthStart-1) — lookback only
 *   netNew = full - prev  — people this month NOT in the previous lookbackDays
 *
 * % Net New = Net New / Monthly Reach
 */
async function computeReachData(
  metaAccountId: string,
  periodMonths: number,
  lookbackDays: number,
): Promise<MonthlyReachRow[]> {
  const now = new Date();
  const months: string[] = [];
  for (let i = periodMonths; i >= 1; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const periodStart = months[0] + "-01";
  const monthNames = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];

  const results: MonthlyReachRow[] = [];
  let prevRolling = 0;

  for (const monthKey of months) {
    const [year, month] = monthKey.split("-").map(Number);
    const monthStart = `${monthKey}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const monthEnd = `${monthKey}-${String(lastDay).padStart(2, "0")}`;

    try {
      if (lookbackDays > 0) {
        // SLIDING lookback: each month compared to its own previous N days
        const windowStart = new Date(monthStart);
        windowStart.setDate(windowStart.getDate() - lookbackDays);
        const ws = windowStart.toISOString().split("T")[0];
        const prevEnd = new Date(monthStart);
        prevEnd.setDate(prevEnd.getDate() - 1);
        const pe = prevEnd.toISOString().split("T")[0];

        const [rollingRes, monthlyRes, slidingFull, slidingPrev] = await Promise.all([
          fetchReach(metaAccountId, periodStart, monthEnd),
          fetchReach(metaAccountId, monthStart, monthEnd),
          fetchReach(metaAccountId, ws, monthEnd),
          fetchReach(metaAccountId, ws, pe),
        ]);

        const netNew = Math.max(0, slidingFull.reach - slidingPrev.reach);
        results.push({
          monthLabel: `${monthNames[month - 1]}. ${String(year).slice(2)}`,
          monthKey,
          rollingReach: rollingRes.reach,
          monthlyReach: monthlyRes.reach,
          netNew,
          netNewPct: monthlyRes.reach > 0 ? parseFloat(((netNew / monthlyRes.reach) * 100).toFixed(1)) : 0,
          spend: monthlyRes.spend,
          cpm: monthlyRes.impressions > 0 ? (monthlyRes.spend / monthlyRes.impressions) * 1000 : 0,
          cpmNetNew: netNew > 0 ? monthlyRes.spend / (netNew / 1000) : 0,
          frequency: monthlyRes.frequency,
        });
      } else {
        // No lookback: net new = rolling increment
        const [rollingRes, monthlyRes] = await Promise.all([
          fetchReach(metaAccountId, periodStart, monthEnd),
          fetchReach(metaAccountId, monthStart, monthEnd),
        ]);

        const netNew = Math.max(0, rollingRes.reach - prevRolling);
        results.push({
          monthLabel: `${monthNames[month - 1]}. ${String(year).slice(2)}`,
          monthKey,
          rollingReach: rollingRes.reach,
          monthlyReach: monthlyRes.reach,
          netNew,
          netNewPct: monthlyRes.reach > 0 ? parseFloat(((netNew / monthlyRes.reach) * 100).toFixed(1)) : 0,
          spend: monthlyRes.spend,
          cpm: monthlyRes.impressions > 0 ? (monthlyRes.spend / monthlyRes.impressions) * 1000 : 0,
          cpmNetNew: netNew > 0 ? monthlyRes.spend / (netNew / 1000) : 0,
          frequency: monthlyRes.frequency,
        });
        prevRolling = rollingRes.reach;
      }
    } catch {
      // Skip months with API errors
    }
  }

  return results.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
}

export default async function ReachPage({
  params,
  searchParams,
}: {
  params: Promise<{ client: string }>;
  searchParams: Promise<{ lookback?: string; period?: string }>;
}) {
  const { client: clientId } = await params;
  const sp = await searchParams;
  const lookback = parseInt(sp.lookback ?? "0", 10);
  const period = sp.period === "3m" ? "3m" : "6m";
  const periodMonths = period === "3m" ? 3 : 6;

  const client = await getClient(clientId);

  const data = client?.metaAccountId
    ? await computeReachData(client.metaAccountId, periodMonths, lookback)
    : [];

  return (
    <ReachClient
      clientId={clientId}
      data={data}
      currentLookback={lookback}
      currentPeriod={period}
    />
  );
}
