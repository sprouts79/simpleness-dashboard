import Link from "next/link";
import { notFound } from "next/navigation";
import { getKunde } from "@/lib/db-kunder";
import {
  getDraft,
  getGodkjent,
  getItems,
} from "@/lib/db-tilstandsanalyse";
import AdminTilstandsanalyse from "./AdminTilstandsanalyse";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function KundeTilstandsanalysePage({ params }: PageProps) {
  const { slug } = await params;
  const kunde = await getKunde(slug);
  if (!kunde) notFound();

  const [draft, godkjent] = await Promise.all([getDraft(slug), getGodkjent(slug)]);
  const aktiv = draft ?? godkjent;
  const items = aktiv ? await getItems(aktiv.id) : [];
  const itemsById = Object.fromEntries(items.map((i) => [i.item_id, i]));

  return (
    <div className="max-w-5xl">
      <Link href={`/kunder/${slug}`} className="text-xs text-[#515b12] hover:underline mb-3 inline-block">← {kunde.name}</Link>

      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Tilstandsanalyse</h1>
          {godkjent && (
            <p className="text-sm text-neutral-500 mt-1">
              Sist godkjent {godkjent.kvartal} av {godkjent.godkjent_av} ·{" "}
              {godkjent.godkjent_dato && new Date(godkjent.godkjent_dato).toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
        </div>
      </header>

      <AdminTilstandsanalyse
        slug={slug}
        kundeNavn={kunde.name}
        simplenessKontakt={kunde.simpleness_contact ?? "Jonas"}
        draft={draft}
        godkjent={godkjent}
        itemsById={itemsById}
      />
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const kunde = await getKunde(slug);
  return { title: kunde ? `${kunde.name} · Tilstandsanalyse · Simpleness OS` : "Tilstandsanalyse" };
}
