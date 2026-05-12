import { getClient } from "@/lib/db";
import { notFound } from "next/navigation";
import BudsjetterTabs from "./BudsjetterTabs";

export const dynamic = "force-dynamic";

export default async function BudsjetterLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ client: string }>;
}) {
  const { client: slug } = await params;
  const client = await getClient(slug);
  if (!client) notFound();

  return (
    <div>
      <div className="mb-3">
        <h1 className="text-2xl font-bold text-neutral-900">Budsjetter</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Salgsbudsjett og mediebudsjett — rammene som gjør at vi vet hva vi sikter mot.
        </p>
      </div>
      <BudsjetterTabs />
      {children}
    </div>
  );
}
