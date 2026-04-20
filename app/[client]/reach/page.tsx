export const dynamic = "force-dynamic";

import { getMonthlyReachData } from "@/lib/db";
import ReachClient from "@/components/reach/ReachClient";

export default async function ReachPage({
  params,
}: {
  params: Promise<{ client: string }>;
}) {
  const { client: clientId } = await params;
  const data = await getMonthlyReachData(clientId, 0);
  return <ReachClient clientId={clientId} data={data} />;
}
