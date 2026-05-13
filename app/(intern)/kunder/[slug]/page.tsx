import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getKunde,
  getClientLeveranser,
  lifecycleStageLabel,
  lifecycleStagePillClass,
  statusLabel,
  arveStatus,
  type ClientLeveranse,
} from "@/lib/db-kunder";
import { getSessionByClientId } from "@/lib/db-onboarding";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function KundeDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const kunde = await getKunde(slug);
  if (!kunde) notFound();

  const [leveranser, session] = await Promise.all([
    getClientLeveranser(kunde.id),
    getSessionByClientId(kunde.id),
  ]);

  const stagePill = lifecycleStagePillClass(kunde.lifecycle_stage);
  const stageText = lifecycleStageLabel(kunde.lifecycle_stage);

  // Children-leveranser fjernes fra rotvisning (de vises ikke separat)
  const rotLeveranser = leveranser.filter((l) => !l.parent_id);

  return (
    <div className="max-w-3xl">
      <header className="mb-8">
        <Link href="/kunder" className="text-xs text-[#515b12] hover:underline mb-3 inline-block">← Kunder</Link>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">{kunde.name}</h1>
          <Pill kind={stagePill}>{stageText}</Pill>
        </div>
      </header>

      <Card title="Kontakt">
        <Row label="Kontaktperson" value={kunde.contact_name ?? "—"} />
        <Row label="E-post" value={kunde.contact_email ?? "—"} mono />
        <Row label="Simpleness-kontakt" value={kunde.simpleness_contact ?? "—"} />
        <Row label="Meta Ad Account" value={kunde.meta_account_id ?? "—"} mono />
      </Card>

      <Card title="Tilstandsanalyse">
        <div className="px-5 py-4">
          <Link href={`/kunder/${kunde.slug}/tilstandsanalyse`} className="text-sm text-[#515b12] hover:underline">
            Åpne tilstandsanalyse →
          </Link>
        </div>
      </Card>

      {session && (
        <Card title="Onboarding">
          <Row label="Token" value={session.token} mono />
          <Row label="Lenke til kunde" value={`/onboard/${session.token}`} mono link={`/onboard/${session.token}`} />
          <Row label="Status" value={`Steg ${session.current_step} av 3`} />
          <Row
            label="Sist aktiv"
            value={new Date(session.last_active_at).toLocaleString("nb-NO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          />
          {session.completed_at && (
            <Row label="Fullført" value={new Date(session.completed_at).toLocaleString("nb-NO")} />
          )}
          <div className="px-5 py-3 border-t border-neutral-200">
            <Link
              href={`/kunder/${kunde.slug}/onboarding`}
              className="text-sm text-[#515b12] hover:underline"
            >
              Se kundens svar →
            </Link>
          </div>
        </Card>
      )}

      <Card title="Aktive leveranser">
        {rotLeveranser.length === 0 ? (
          <div className="px-5 py-6 text-sm text-neutral-500">Ingen leveranser aktivert</div>
        ) : (
          rotLeveranser.map((l) => (
            <LeveranseRow
              key={l.id}
              leveranse={l}
              alle={leveranser}
            />
          ))
        )}
      </Card>
    </div>
  );
}

function LeveranseRow({ leveranse, alle }: { leveranse: ClientLeveranse; alle: ClientLeveranse[] }) {
  const status = arveStatus(leveranse, alle);
  const pillKind = status === "godkjent" ? "done" : status === "til_avsjekk" ? "review" : "idle";
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-t border-neutral-200 first:border-t-0 text-sm">
      <div className="min-w-0 flex-1">
        <div className="font-medium text-neutral-900">{leveranse.navn}</div>
        {leveranse.kort_beskrivelse && (
          <div className="text-xs text-neutral-500 mt-0.5">{leveranse.kort_beskrivelse}</div>
        )}
      </div>
      <Pill kind={pillKind}>{statusLabel(status)}</Pill>
    </div>
  );
}

const PILL_STYLES = {
  done:     { bg: "bg-green-50",    fg: "text-green-900",   dot: "bg-green-500" },
  review:   { bg: "bg-yellow-50",   fg: "text-yellow-900",  dot: "bg-yellow-500" },
  idle:     { bg: "bg-neutral-100", fg: "text-neutral-700", dot: "bg-neutral-400" },
  archived: { bg: "bg-neutral-100", fg: "text-neutral-500", dot: "bg-neutral-300", opacity: "opacity-70" },
};

function Pill({ kind, children }: { kind: keyof typeof PILL_STYLES; children: React.ReactNode }) {
  const s = PILL_STYLES[kind];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.bg} ${s.fg} ${"opacity" in s ? (s.opacity as string) : ""}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {children}
    </span>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden mb-4">
      <h3 className="px-5 py-3 text-sm font-semibold text-neutral-900 bg-neutral-50 border-b border-neutral-200">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  link,
}: {
  label: string;
  value: string;
  mono?: boolean;
  link?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3 border-t border-neutral-200 first:border-t-0 text-sm">
      <span className="text-neutral-500">{label}</span>
      {link ? (
        <Link href={link} className={`${mono ? "font-mono text-[13px]" : ""} text-[#515b12] hover:underline`}>
          {value}
        </Link>
      ) : (
        <span className={`text-neutral-900 ${mono ? "font-mono text-[13px]" : ""}`}>{value}</span>
      )}
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const kunde = await getKunde(slug);
  return { title: kunde ? `${kunde.name} · Kunder · Simpleness OS` : "Kunde · Simpleness OS" };
}
