import SalgsbudsjettView from "@/components/budsjetter/SalgsbudsjettView";
import MediebudsjettView from "@/components/budsjetter/MediebudsjettView";

export const dynamic = "force-dynamic";

export default async function BudsjetterPage({
  params,
  searchParams,
}: {
  params: Promise<{ client: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { client: clientId } = await params;
  const sp = await searchParams;
  const tab = sp.tab ?? "salg";

  if (tab === "media") return <MediebudsjettView clientId={clientId} />;
  return <SalgsbudsjettView clientId={clientId} />;
}
