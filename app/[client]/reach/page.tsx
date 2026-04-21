export const dynamic = "force-dynamic";

import { getMonthlyReachData } from "@/lib/db";
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
  const lookback = parseInt(sp.lookback ?? "90", 10); // default 90 days (3 mnd)
  const period = sp.period === "3m" ? "3m" : "6m"; // default 6m

  const data = await getMonthlyReachData(clientId, lookback);

  return (
    <ReachClient
      clientId={clientId}
      data={data}
      currentLookback={lookback}
      currentPeriod={period}
    />
  );
}
