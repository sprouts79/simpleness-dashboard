export const dynamic = "force-dynamic";

import { getMonthlyReachData } from "@/lib/db";
import ReachClient from "@/components/reach/ReachClient";

export default async function ReachPage({
  params,
  searchParams,
}: {
  params: Promise<{ client: string }>;
  searchParams: Promise<{ lookback?: string }>;
}) {
  const { client: clientId } = await params;
  const { lookback: lookbackStr } = await searchParams;
  const lookback = parseInt(lookbackStr ?? "90");
  const data = await getMonthlyReachData(clientId, lookback);
  return <ReachClient clientId={clientId} data={data} currentLookback={lookback} />;
}
