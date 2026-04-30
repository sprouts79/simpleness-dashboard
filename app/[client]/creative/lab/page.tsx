import { getAdLabData } from "@/lib/db";
import CreativeLabClient from "@/components/creative/lab/CreativeLabClient";

export default async function CreativeLabPage({
  params,
}: {
  params: Promise<{ client: string }>;
}) {
  const { client: clientSlug } = await params;
  const ads = await getAdLabData(clientSlug);

  return <CreativeLabClient clientSlug={clientSlug} ads={ads} />;
}
