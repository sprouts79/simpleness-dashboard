import Link from "next/link";
import { notFound } from "next/navigation";
import { hentKundeomrade } from "@/lib/clients-leveranser";
import {
  getDropsForKunde,
  getScansForKunde,
  statusCounts,
  todayInOslo,
  type NewsjackingDrop,
  type NewsjackingStatus,
} from "@/lib/db-newsjacking";
import VoteButtons from "./VoteButtons";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const STATUS_LABEL: Record<NewsjackingStatus, string> = {
  foreslatt: "Foreslått",
  godkjent: "Godkjent",
  avvist: "Avvist",
};

const STATUS_CLASS: Record<NewsjackingStatus, string> = {
  foreslatt: "bg-yellow-50 text-yellow-900",
  godkjent: "bg-green-50 text-green-700",
  avvist: "bg-red-50 text-red-700",
};

export default async function NewsjackingPage({ params }: PageProps) {
  const { slug } = await params;
  const kunde = hentKundeomrade(slug);
  if (!kunde) notFound();

  const [drops, scans] = await Promise.all([
    getDropsForKunde(slug),
    getScansForKunde(slug),
  ]);

  const counts = statusCounts(drops);
  const today = todayInOslo();
  const todayDrops = drops.filter((d) => d.dato === today);
  const earlierScans = scans.filter((s) => s.dato !== today);

  return (
    <div>
      <Link
        href={`/kunde/${slug}`}
        className="text-xs text-[#515b12] hover:underline mb-3 inline-block"
      >
        ← {kunde.navn}
      </Link>

      <header className="border-b border-neutral-200 pb-8 mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900">
          Newsjacking
        </h1>
      </header>

      <div className="grid grid-cols-3 gap-2 mb-12">
        <PipelineCard label="Foreslått" value={counts.foreslatt} />
        <PipelineCard label="Godkjent" value={counts.godkjent} />
        <PipelineCard label="Avvist" value={counts.avvist} />
      </div>

      <section className="mb-12">
        <SectionHeader title={dagLabel(today)} />
        {todayDrops.length === 0 ? (
          <EmptyDag />
        ) : (
          <div className="space-y-2">
            {todayDrops.map((drop) => (
              <DropCard key={drop.id} drop={drop} kundeSlug={slug} />
            ))}
          </div>
        )}
      </section>

      {earlierScans.length > 0 && (
        <section>
          <SectionHeader title="Tidligere" />
          <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
            {earlierScans.map((scan) => {
              const dagDrops = drops.filter((d) => d.dato === scan.dato);
              return (
                <DagRad
                  key={scan.id}
                  dato={scan.dato}
                  ukedag={scan.ukedag}
                  ideerPostet={scan.ideer_postet}
                  drops={dagDrops}
                />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function PipelineCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-5 py-4">
      <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-medium">
        {label}
      </div>
      <div className="mt-1 text-3xl font-semibold tracking-tight text-neutral-900 font-mono">
        {value}
      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-4 pb-2 border-b border-neutral-200">
      {title}
    </h2>
  );
}

function EmptyDag() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white px-6 py-10 text-center text-sm text-neutral-500">
      Ingen ideer over terskel i dag.
    </div>
  );
}

function DropCard({
  drop,
  kundeSlug,
}: {
  drop: NewsjackingDrop;
  kundeSlug: string;
}) {
  return (
    <article className="rounded-xl border border-neutral-200 bg-white p-6">
      <div className="flex items-start justify-between gap-6 mb-4">
        <h3 className="text-base font-semibold text-neutral-900 leading-snug">
          {drop.tittel}
        </h3>
        <span
          className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_CLASS[drop.status]}`}
        >
          {STATUS_LABEL[drop.status]}
        </span>
      </div>

      <p className="text-sm text-neutral-600 mb-4">{drop.beskrivelse}</p>

      <blockquote className="text-[15px] font-medium text-neutral-900 bg-yellow-50 border-l-[3px] border-yellow-500 rounded px-4 py-3 mb-4">
        “{drop.du_vinkling}”
      </blockquote>

      <div className="flex items-center justify-between gap-4">
        <div className="text-xs text-neutral-500 font-mono">
          {drop.sources.length > 0
            ? drop.sources.map((s, i) => (
                <span key={i}>
                  {i > 0 && " · "}
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 hover:underline"
                  >
                    {s.navn}
                  </a>
                </span>
              ))
            : ""}
        </div>
        <VoteButtons
          dropId={drop.id}
          kundeSlug={kundeSlug}
          status={drop.status}
        />
      </div>
    </article>
  );
}

function DagRad({
  dato,
  ukedag,
  ideerPostet,
  drops,
}: {
  dato: string;
  ukedag: string;
  ideerPostet: number;
  drops: NewsjackingDrop[];
}) {
  const counts = drops.reduce(
    (acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const oppsummering =
    ideerPostet === 0
      ? "—"
      : Object.entries(STATUS_LABEL)
          .filter(([k]) => counts[k])
          .map(([k, label]) => `${counts[k]} ${label.toLowerCase()}`)
          .join(" · ");

  return (
    <div className="grid grid-cols-[140px_1fr_80px] gap-4 px-6 py-3 border-t border-neutral-100 first:border-t-0 text-sm items-center">
      <span className="font-mono text-xs text-neutral-600">
        {ukedag} {formatDato(dato)}
      </span>
      <span className="text-neutral-600">{oppsummering}</span>
      <span className="font-mono text-xs text-neutral-500 text-right">
        {ideerPostet} idé{ideerPostet === 1 ? "" : "er"}
      </span>
    </div>
  );
}

function formatDato(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${parseInt(d, 10)}. ${MND[parseInt(m, 10) - 1]}`;
}

function dagLabel(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  const ukedag = ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"][d.getDay()];
  return `${ukedag} ${formatDato(iso)}`;
}

const MND = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const kunde = hentKundeomrade(slug);
  return {
    title: kunde ? `Newsjacking · ${kunde.navn}` : "Newsjacking",
  };
}
