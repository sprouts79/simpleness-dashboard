import { getClient } from "@/lib/db";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EnhetsokonomiLayout({
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Enhetsøkonomi</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Modellen som definerer mål — kundeverdi, kostnader, CAC og dekningsbidrag.
        </p>
      </div>
      {children}
    </div>
  );
}
