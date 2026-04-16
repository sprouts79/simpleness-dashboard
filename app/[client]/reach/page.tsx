export const dynamic = "force-dynamic";

import { getReachComposition, getReachTable } from "@/lib/db";
import ReachClient from "@/components/reach/ReachClient";

export default async function ReachPage({
  params,
}: {
  params: Promise<{ client: string }>;
}) {
  const { client: clientId } = await params;

  const [composition, table] = await Promise.all([
    getReachComposition(clientId),
    getReachTable(clientId),
  ]);

  return <ReachClient clientId={clientId} composition={composition} table={table} />;
}
