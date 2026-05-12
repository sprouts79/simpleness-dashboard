import { getClient } from "@/lib/db";
import { notFound } from "next/navigation";
import ForecastPrototype from "@/components/forecast/ForecastPrototype";

export const dynamic = "force-dynamic";

export default async function ForecastPage({
  params,
  searchParams,
}: {
  params: Promise<{ client: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { client: clientId } = await params;
  const sp = await searchParams;
  const isPrototype = sp.prototype === "1";

  const client = await getClient(clientId);
  if (!client) notFound();

  if (!isPrototype) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-8 max-w-2xl">
        <p className="text-sm text-neutral-600">
          <span className="font-medium text-neutral-900">Forecast og rapport</span> er under bygging. Aktiver{" "}
          <span className="font-medium text-neutral-900">Prototype</span>-toggelet i toppen for å forhåndsvise.
        </p>
      </div>
    );
  }

  return <ForecastPrototype clientId={clientId} />;
}
