export const dynamic = "force-dynamic";

import { getMonthlyReachData, getWeeklyReachData } from "@/lib/db";
import ReachClient from "@/components/reach/ReachClient";

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
  const periodWeeks = sp.period === "6m" ? 26 : 13; // default 3m = ~13 weeks

  const [monthlyData, weeklyData] = await Promise.all([
    getMonthlyReachData(clientId, lookback),
    getWeeklyReachData(clientId, lookback, periodWeeks),
  ]);

  return (
    <ReachClient
      clientId={clientId}
      data={monthlyData}
      weeklyData={weeklyData}
      currentLookback={lookback}
      currentPeriod={sp.period === "6m" ? "6m" : "3m"}
    />
  );
}
