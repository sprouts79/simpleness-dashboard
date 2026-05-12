import { getAdLabData, getFatigueData } from "@/lib/db";
import CreativeLabClient from "@/components/creative/lab/CreativeLabClient";

export default async function CreativeLabPage({
  params,
}: {
  params: Promise<{ client: string }>;
}) {
  const { client: clientSlug } = await params;
  const [ads, fatigue] = await Promise.all([
    getAdLabData(clientSlug),
    getFatigueData(clientSlug),
  ]);

  return <CreativeLabClient clientSlug={clientSlug} ads={ads} fatigue={fatigue} />;
}
