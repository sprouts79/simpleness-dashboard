export const dynamic = "force-dynamic";

import { getMonthlyReachData, getClient } from "@/lib/db";
import { fetchReach } from "@/lib/meta-api";
import ReachClient from "@/components/reach/ReachClient";
import { MonthlyReachRow } from "@/lib/types";

/**
 * Computes reach metrics using the SAME methodology as the reference app (Ad Insights):
 *
 * 1. Rolling Reach[month] = fetchReach(windowStart, monthEnd) — cumulative from window start
 * 2. Monthly Reach = fetchReach(monthStart, monthEnd) — unique reach for that month only
 * 3. Net New = Rolling[month] - Rolling[month-1] — incremental unique people
 * 4. % Net New = Net New / Monthly Reach — fraction of this month's audience that is new
 *
 * windowStart = displayPeriodStart - lookbackDays
 */
async function computeMonthlyReach(
  data: MonthlyReachRow[],
  metaAccountId: string,
  lookbackDays: number,
): Promise<MonthlyReachRow[]> {
  if (!data.length || !metaAccountId) return data;

  // Data is newest-first; we need oldest-first for rolling computation
  const sorted = [...data].sort((a, b) => a.monthKey.localeCompare(b.monthKey));

  // Determine window start: earliest month start minus lookback
  const firstMonthStart = sorted[0].monthKey + "-01";
  const windowStartDate = new Date(firstMonthStart);
  windowStartDate.setDate(windowStartDate.getDate() - lookbackDays);
  const windowStart = windowStartDate.toISOString().split("T")[0];

  // For each month: fetch rolling reach (from windowStart) and monthly unique reach
  // 2 API calls per month, run sequentially to avoid rate limits
  const enriched: MonthlyReachRow[] = [];
  let prevRolling = 0;

  // First: if there's a lookback, get the baseline rolling reach
  if (lookbackDays > 0) {
    const baselineEnd = new Date(firstMonthStart);
    baselineEnd.setDate(baselineEnd.getDate() - 1);
    const baselineEndStr = baselineEnd.toISOString().split("T")[0];
    try {
      const baseline = await fetchReach(metaAccountId, windowStart, baselineEndStr);
      prevRolling = baseline.reach;
    } catch {
      // If baseline fetch fails, start from 0
    }
  }

  for (const row of sorted) {
    const [year, month] = row.monthKey.split("-").map(Number);
    const monthStart = row.monthKey + "-01";
    const lastDay = new Date(year, month, 0).getDate();
    const monthEnd = `${row.monthKey}-${String(lastDay).padStart(2, "0")}`;

    try {
      // Two API calls: rolling reach + monthly unique reach
      const [rollingResult, monthlyResult] = await Promise.all([
        fetchReach(metaAccountId, windowStart, monthEnd),
        fetchReach(metaAccountId, monthStart, monthEnd),
      ]);

      const rollingReach = rollingResult.reach;
      const monthlyReach = monthlyResult.reach;
      const netNew = Math.max(0, rollingReach - prevRolling);
      const netNewPct = monthlyReach > 0
        ? parseFloat(((netNew / monthlyReach) * 100).toFixed(1))
        : 0;

      enriched.push({
        ...row,
        rollingReach,
        monthlyReach,
        netNew,
        netNewPct,
        cpmNetNew: netNew > 0 ? row.spend / (netNew / 1000) : 0,
      });

      prevRolling = rollingReach;
    } catch {
      enriched.push(row);
      prevRolling = row.rollingReach;
    }
  }

  // Return newest-first (matching original order)
  return enriched.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
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
  const lookback = parseInt(sp.lookback ?? "0", 10); // default: no lookback (matches reference app default)
  const period = sp.period === "3m" ? "3m" : "6m";

  const [rawData, client] = await Promise.all([
    getMonthlyReachData(clientId, lookback),
    getClient(clientId),
  ]);

  // Compute correct reach metrics from Meta API (2 calls per month)
  const data = client?.metaAccountId
    ? await computeMonthlyReach(rawData, client.metaAccountId, lookback)
    : rawData;

  return (
    <ReachClient
      clientId={clientId}
      data={data}
      currentLookback={lookback}
      currentPeriod={period}
    />
  );
}
