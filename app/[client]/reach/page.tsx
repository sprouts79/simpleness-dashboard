export const dynamic = "force-dynamic";

import { getClient } from "@/lib/db";
import { fetchReach } from "@/lib/meta-api";
import ReachClient from "@/components/reach/ReachClient";
import { MonthlyReachRow } from "@/lib/types";

/**
 * Computes reach metrics matching the reference app (Ad Insights) exactly:
 *
 * Rolling Reach[month] = fetchReach(periodStart, monthEnd) — cumulative from PERIOD start
 * Monthly Reach         = fetchReach(monthStart, monthEnd) — unique reach that month
 * Net New               = extendedCumulative[month] - extendedCumulative[month-1]
 *                         where extended starts from (periodStart - lookbackDays)
 * % Net New             = Net New / Monthly Reach
 *
 * When lookback = 0: extended = rolling, so Net New = Rolling[n] - Rolling[n-1]
 * When lookback > 0: extended includes baseline, so more people are "previously seen"
 *
 * Rolling Reach is ALWAYS from period start (for display), independent of lookback.
 */
async function computeReachData(
  metaAccountId: string,
  periodMonths: number,
  lookbackDays: number,
): Promise<MonthlyReachRow[]> {
  // Determine complete calendar months (exclude current month)
  const now = new Date();
  const months: string[] = [];
  for (let i = periodMonths; i >= 1; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const periodStart = months[0] + "-01"; // first day of first month
  const windowStart = lookbackDays > 0
    ? (() => {
        const d = new Date(periodStart);
        d.setDate(d.getDate() - lookbackDays);
        return d.toISOString().split("T")[0];
      })()
    : periodStart;

  // Get baseline (extended cumulative BEFORE the first display month)
  let prevExtended = 0;
  if (lookbackDays > 0) {
    const baselineEnd = new Date(periodStart);
    baselineEnd.setDate(baselineEnd.getDate() - 1);
    try {
      const result = await fetchReach(metaAccountId, windowStart, baselineEnd.toISOString().split("T")[0]);
      prevExtended = result.reach;
    } catch { /* start from 0 */ }
  }

  const results: MonthlyReachRow[] = [];
  const monthNames = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];

  for (const monthKey of months) {
    const [year, month] = monthKey.split("-").map(Number);
    const monthStart = `${monthKey}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const monthEnd = `${monthKey}-${String(lastDay).padStart(2, "0")}`;

    try {
      // 3 API calls per month (2 if no lookback since rolling = extended)
      const [rollingResult, monthlyResult, extendedResult] = await Promise.all([
        fetchReach(metaAccountId, periodStart, monthEnd),
        fetchReach(metaAccountId, monthStart, monthEnd),
        lookbackDays > 0
          ? fetchReach(metaAccountId, windowStart, monthEnd)
          : null,
      ]);

      const rollingReach = rollingResult.reach;
      const monthlyReach = monthlyResult.reach;
      const extended = extendedResult ? extendedResult.reach : rollingReach;
      const netNew = Math.max(0, extended - prevExtended);
      const netNewPct = monthlyReach > 0
        ? parseFloat(((netNew / monthlyReach) * 100).toFixed(1))
        : 0;
      const spend = rollingResult.spend; // spend from the rolling call covers period
      const monthlySpend = monthlyResult.spend;
      const frequency = monthlyResult.frequency;

      results.push({
        monthLabel: `${monthNames[month - 1]}. ${String(year).slice(2)}`,
        monthKey,
        rollingReach,
        monthlyReach,
        netNew,
        netNewPct,
        spend: monthlySpend,
        cpm: monthlyResult.impressions > 0 ? (monthlySpend / monthlyResult.impressions) * 1000 : 0,
        cpmNetNew: netNew > 0 ? monthlySpend / (netNew / 1000) : 0,
        frequency,
      });

      prevExtended = extended;
    } catch {
      // Skip months with API errors
    }
  }

  // Return newest-first
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

  // Compute reach directly from Meta API (no DB dependency for reach metrics)
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
