import Link from "next/link";
import { notFound } from "next/navigation";
import { getKunde } from "@/lib/db-kunder";
import { getConfig, getResponses } from "@/lib/db-tilstandsanalyse";
import { getCurrentQuarter } from "@/lib/checklist-data";
import ChecklistShell from "./ChecklistShell";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function TilstandsanalysePage({ params }: PageProps) {
  const { slug } = await params;
  const kunde = await getKunde(slug);
  if (!kunde) notFound();

  const quarter = getCurrentQuarter();
  const [config, responses] = await Promise.all([
    getConfig(kunde.id),
    getResponses(kunde.id, quarter),
  ]);

  return (
    <div>
      <Link href={`/kunde/${slug}`} className="text-xs text-[#515b12] hover:underline mb-3 inline-block">
        ← {kunde.name}
      </Link>

      <header className="border-b border-neutral-200 pb-6 mb-8">
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Tilstandsanalyse</h1>
          <span className="font-mono text-xs text-neutral-500">{quarter}</span>
        </div>
      </header>

      <ChecklistShell
        slug={slug}
        quarter={quarter}
        trackingMode={config.tracking_mode}
        snapActive={config.snap_active}
        responses={responses}
      />
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const kunde = await getKunde(slug);
  return { title: kunde ? `Tilstandsanalyse · ${kunde.name} · Simpleness OS` : "Tilstandsanalyse" };
}
