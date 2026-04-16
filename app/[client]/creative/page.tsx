import { getAds, getCohorts, getCreativeChurn, getTopAds } from "@/lib/db";
import CreativeClient from "@/components/creative/CreativeClient";

export default async function CreativePage({
  params,
}: {
  params: Promise<{ client: string }>;
}) {
  const { client: clientId } = await params;

  const [ads, cohorts, churnData, topWeek, topMonth, topQuarter] = await Promise.all([
    getAds(clientId),
    getCohorts(clientId),
    getCreativeChurn(clientId),
    getTopAds(clientId, 7),
    getTopAds(clientId, 30),
    getTopAds(clientId, 90),
  ]);

  return (
    <CreativeClient
      clientId={clientId}
      ads={ads}
      cohorts={cohorts}
      churnData={churnData}
      topWeek={topWeek}
      topMonth={topMonth}
      topQuarter={topQuarter}
    />
  );
}
