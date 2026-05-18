import Link from "next/link";
import { notFound } from "next/navigation";
import { hentKundeomradeDB, getKunde } from "@/lib/db-kunder";
import {
  PERFORMANCE_LEVERANSER,
  PROSJEKT_LEVERANSER,
  arveStatus,
  type ClientLeveranse,
  type LeveranseStatus,
} from "@/lib/types-kunder";
import { getClientLeveranser } from "@/lib/db-kunder";
import StatusPill from "@/components/kunde/StatusPill";

const LEVERANSE_RUTE: Record<string, string> = {
  tilstandsanalyse: "tilstandsanalyse",
  newsjacking: "newsjacking",
};

const STANDARD_PROSJEKT_SLUGS: Set<string> = new Set(
  PROSJEKT_LEVERANSER.map((p) => p.slug),
);

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function KundeOmradePage({ params }: PageProps) {
  const { slug } = await params;
  const omrade = await hentKundeomradeDB(slug);
  if (!omrade) notFound();

  const kunde = await getKunde(slug);
  const alleLev = kunde ? await getClientLeveranser(kunde.id) : [];

  const performanceMap = new Map(omrade.performance.map((l) => [l.slug, l]));
  const prosjektMap = new Map(omrade.prosjekter.map((l) => [l.slug, l]));

  return (
    <div className="space-y-12">
      <header className="border-b border-neutral-200 pb-8">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900">
          {omrade.navn}
        </h1>
        <p className="mt-2 text-neutral-500">Kundeområde</p>
      </header>

      <LeveransListe
        kundeSlug={slug}
        tittel="Performance"
        beskrivelse="Den faste retainerleveransen — alt vi gjør månedlig for deg."
        leveranser={PERFORMANCE_LEVERANSER.map((mal) => ({
          mal,
          aktiv: performanceMap.get(mal.slug) ?? null,
        }))}
        alleLev={alleLev}
      />

      <LeveransListe
        kundeSlug={slug}
        tittel="Prosjekter"
        beskrivelse="Enkeltstående leveranser ved siden av Performance."
        leveranser={[
          ...PROSJEKT_LEVERANSER.map((mal) => ({
            mal,
            aktiv: prosjektMap.get(mal.slug) ?? null,
          })),
          ...omrade.prosjekter
            .filter((p) => !STANDARD_PROSJEKT_SLUGS.has(p.slug))
            .map((p) => ({
              mal: { slug: p.slug, navn: p.navn },
              aktiv: p,
            })),
        ]}
        alleLev={alleLev}
      />

      <footer className="border-t border-neutral-200 pt-6 text-xs text-neutral-400">
        Simpleness OS · {new Date().toLocaleDateString("nb-NO", { year: "numeric", month: "long" })}
      </footer>
    </div>
  );
}

interface LeveransListeProps {
  kundeSlug: string;
  tittel: string;
  beskrivelse: string;
  leveranser: Array<{
    mal: { readonly slug: string; readonly navn: string };
    aktiv: ClientLeveranse | null;
  }>;
  alleLev: ClientLeveranse[];
}

function LeveransListe({ kundeSlug, tittel, beskrivelse, leveranser, alleLev }: LeveransListeProps) {
  return (
    <section>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-neutral-900">{tittel}</h2>
        <p className="mt-1 text-sm text-neutral-500">{beskrivelse}</p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        {leveranser.map(({ mal, aktiv }, idx) => (
          <LeveransRad
            key={mal.slug}
            kundeSlug={kundeSlug}
            slug={mal.slug}
            navn={mal.navn}
            leveranse={aktiv}
            alleLev={alleLev}
            erFørste={idx === 0}
          />
        ))}
      </div>
    </section>
  );
}

interface LeveransRadProps {
  kundeSlug: string;
  slug: string;
  navn: string;
  leveranse: ClientLeveranse | null;
  alleLev: ClientLeveranse[];
  erFørste: boolean;
}

function LeveransRad({ kundeSlug, slug, navn, leveranse, alleLev, erFørste }: LeveransRadProps) {
  const aktiv = leveranse !== null;
  const status: LeveranseStatus = aktiv ? arveStatus(leveranse, alleLev) : "under_utvikling";
  const børderTopp = erFørste ? "" : "border-t border-neutral-200";
  const subRoute = aktiv ? LEVERANSE_RUTE[slug] : undefined;
  const href = subRoute ? `/kunde/${kundeSlug}/${subRoute}` : null;

  const inner = (
    <div
      className={`flex items-center justify-between gap-4 px-5 py-4 ${børderTopp} ${aktiv ? "" : "bg-neutral-50"} ${
        href ? "hover:bg-neutral-50 transition-colors" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className={`text-sm font-medium ${aktiv ? "text-neutral-900" : "text-neutral-400"}`}>
          {navn}
        </div>
        {aktiv && leveranse.kort_beskrivelse && (
          <div className="mt-0.5 text-xs text-neutral-500">{leveranse.kort_beskrivelse}</div>
        )}
        {!aktiv && (
          <div className="mt-0.5 text-xs text-neutral-400">Ikke aktivert</div>
        )}
      </div>

      {aktiv ? (
        <StatusPill status={status} slug={slug} />
      ) : (
        <StatusPill status="under_utvikling" disabled />
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const omrade = await hentKundeomradeDB(slug);
  return {
    title: omrade ? `${omrade.navn} · Simpleness OS` : "Kundeområde · Simpleness OS",
  };
}
