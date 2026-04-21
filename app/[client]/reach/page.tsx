export const dynamic = "force-dynamic";

import { getMonthlyReachData, getClient } from "@/lib/db";
import { fetchReach } from "@/lib/meta-api";
import ReachClient from "@/components/reach/ReachClient";

/**
 * For each month, fetch the TRUE monthly unique reach from Meta API.
 * This gives the correct denominator for Net New % (not the overcounted sum of weekly reach).
 */
async function enrichWithMonthlyReach(
  data: Awaited<ReturnType<typeof getMonthlyReachData>>,
  metaAccountId: string,
) {
  if (!data.length || !metaAccountId) return data;

  // Fetch true monthly unique reach in parallel (one API call per month)
  const enriched = await Promise.all(
    data.map(async (row) => {
      const [year, month] = row.monthKey.split("-").map(Number);
      const monthStart = row.monthKey + "-01";
      const lastDay = new Date(year, month, 0).getDate(); // last day of month
      const monthEnd = `${row.monthKey}-${String(lastDay).padStart(2, "0")}`;

      try {
        const result = await fetchReach(metaAccountId, monthStart, monthEnd);
        const monthlyUniqueReach = result.reach;
        const netNewPct = monthlyUniqueReach > 0
          ? parseFloat(((row.netNew / monthlyUniqueReach) * 100).toFixed(1))
          : row.netNewPct;
        return { ...row, netNewPct, monthlyReach: monthlyUniqueReach };
      } catch {
        return row; // fallback to existing value on API error
      }
    })
  );

  return enriched;
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
  const lookback = parseInt(sp.lookback ?? "90", 10);
  const period = sp.period === "3m" ? "3m" : "6m";

  const [rawData, client] = await Promise.all([
    getMonthlyReachData(clientId, lookback),
    getClient(clientId),
  ]);

  // Enrich with true monthly unique reach from Meta API
  const data = client?.metaAccountId
    ? await enrichWithMonthlyReach(rawData, client.metaAccountId)
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
