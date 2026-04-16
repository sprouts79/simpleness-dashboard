import { getReachKpis, getReachComposition, getReachTable } from "@/lib/db";
import ReachClient from "@/components/reach/ReachClient";

export default async function ReachPage({
  params,
}: {
  params: Promise<{ client: string }>;
}) {
  const { client: clientId } = await params;

  const [kpis, composition, table] = await Promise.all([
    getReachKpis(clientId),
    getReachComposition(clientId),
    getReachTable(clientId),
  ]);

  if (!kpis) {
    return (
      <div className="p-8 text-sm text-[rgba(9,10,8,0.4)]">Ingen reach-data tilgjengelig ennå.</div>
    );
  }

  return <ReachClient kpis={kpis} composition={composition} table={table} />;
}
