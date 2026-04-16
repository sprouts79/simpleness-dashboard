import { getAds, getCohorts, getCreativeChurn } from "@/lib/db";
import CreativeClient from "@/components/creative/CreativeClient";

export default async function CreativePage({
  params,
}: {
  params: Promise<{ client: string }>;
}) {
  const { client: clientId } = await params;

  const [ads, cohorts, churnData] = await Promise.all([
    getAds(clientId),
    getCohorts(clientId),
    getCreativeChurn(clientId),
  ]);

  return <CreativeClient ads={ads} cohorts={cohorts} churnData={churnData} />;
}
