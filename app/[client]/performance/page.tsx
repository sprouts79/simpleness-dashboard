import { getPerformanceKpis, getSpendTrend, getCampaigns } from "@/lib/db";
import PerformanceClient from "@/components/performance/PerformanceClient";

export default async function PerformancePage({
  params,
}: {
  params: Promise<{ client: string }>;
}) {
  const { client: clientId } = await params;

  const [kpis, trend, campaigns] = await Promise.all([
    getPerformanceKpis(clientId),
    getSpendTrend(clientId),
    getCampaigns(clientId),
  ]);

  if (!kpis) {
    return (
      <div className="p-8 text-sm text-[rgba(9,10,8,0.4)]">Ingen data.</div>
    );
  }

  return <PerformanceClient kpis={kpis} trend={trend} campaigns={campaigns} />;
}
