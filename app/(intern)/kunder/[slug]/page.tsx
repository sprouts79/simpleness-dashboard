import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getKunde,
  getClientLeveranser,
  lifecycleStageLabel,
  lifecycleStagePillClass,
  statusLabel,
  arveStatus,
  PERFORMANCE_LEVERANSER,
  PROSJEKT_LEVERANSER,
  type ClientLeveranse,
  type LeveranseStatus,
} from "@/lib/db-kunder";
import { getSessionByClientId } from "@/lib/db-onboarding";
import SlackInviteEditor from "./SlackInviteEditor";
import RadgiverEditor from "./RadgiverEditor";
import AktiverLeveranseButton from "./AktiverLeveranseButton";

// Leveranser med egen rute. Returnerer full path fra slug.
// Tilstandsanalyse lever på kunde-siden (samme view for begge), de andre
// har sine egne admin-views under /kunder/[slug]/.
const LEVERANSE_RUTE: Record<string, (kundeSlug: string) => string> = {
  onboarding: (s) => `/kunder/${s}/onboarding`,
  tilstandsanalyse: (s) => `/kunde/${s}/tilstandsanalyse`,
};

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

  const aktivBySlug = new Map(leveranser.filter((l) => l.aktiv).map((l) => [l.slug, l]));

  const performanceRows = PERFORMANCE_LEVERANSER.map((mal) => ({
    slug: mal.slug,
    navn: mal.navn,
    aktiv: aktivBySlug.get(mal.slug) ?? null,
    kategori: "performance" as const,
  }));

  const standardProsjektSlugs = new Set<string>(PROSJEKT_LEVERANSER.map((p) => p.slug));
  const customProsjekter = leveranser.filter(
    (l) => l.aktiv && l.kategori === "prosjekter" && !standardProsjektSlugs.has(l.slug),
  );
  const prosjektRows = [
    ...PROSJEKT_LEVERANSER.map((mal) => ({
      slug: mal.slug,
      navn: mal.navn,
      aktiv: aktivBySlug.get(mal.slug) ?? null,
      kategori: "prosjekter" as const,
    })),
    ...customProsjekter.map((l) => ({
      slug: l.slug,
      navn: l.navn,
      aktiv: l,
      kategori: "prosjekter" as const,
    })),
  ];

  return (
    <div className="max-w-3xl">
      <header className="mb-8">
        <Link href="/kunder" className="text-xs text-[#515b12] hover:underline mb-3 inline-block">← Kunder</Link>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">{kunde.name}</h1>
          <div className="flex items-center gap-3">
            <Link href={`/kunde/${kunde.slug}`} className="text-sm text-[#515b12] hover:underline">
              Se kundeområdet →
            </Link>
            <Pill kind={stagePill}>{stageText}</Pill>
          </div>
        </div>
      </header>

      <Card title="Kontakt">
        <Row label="Kontaktperson" value={kunde.contact_name ?? "—"} />
        <Row label="E-post" value={kunde.contact_email ?? "—"} mono />
        <Row label="Meta Ad Account" value={kunde.meta_account_id ?? "—"} mono />
      </Card>

      <Card title="Rådgiver">
        <RadgiverEditor slug={kunde.slug} initial={kunde.simpleness_contact} />
      </Card>

      <Card title="Slack-kanal">
        <SlackInviteEditor slug={kunde.slug} initialUrl={kunde.slack_invite_url} />
      </Card>

      {session && (
        <Card title="Onboarding-session">
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
        </Card>
      )}

      <Card title="Performance">
        {performanceRows.map((row, i) => (
          <LeveranseRad
            key={row.slug}
            kundeSlug={kunde.slug}
            leveranseSlug={row.slug}
            navn={row.navn}
            aktiv={row.aktiv}
            kategori={row.kategori}
            alle={leveranser}
            erFørste={i === 0}
          />
        ))}
      </Card>

      <Card title="Prosjekter">
        {prosjektRows.map((row, i) => (
          <LeveranseRad
            key={row.slug}
            kundeSlug={kunde.slug}
            leveranseSlug={row.slug}
            navn={row.navn}
            aktiv={row.aktiv}
            kategori={row.kategori}
            alle={leveranser}
            erFørste={i === 0}
          />
        ))}
      </Card>
    </div>
  );
}

interface LeveranseRadProps {
  kundeSlug: string;
  leveranseSlug: string;
  navn: string;
  aktiv: ClientLeveranse | null;
  kategori: "performance" | "prosjekter";
  alle: ClientLeveranse[];
  erFørste: boolean;
}

function LeveranseRad({ kundeSlug, leveranseSlug, navn, aktiv, kategori, alle, erFørste }: LeveranseRadProps) {
  const ruteFn = LEVERANSE_RUTE[leveranseSlug];
  const href = aktiv && ruteFn ? ruteFn(kundeSlug) : null;
  const børderTopp = erFørste ? "" : "border-t border-neutral-200";

  const inner = (
    <div className={`flex items-center justify-between gap-4 px-5 py-3.5 ${børderTopp} ${aktiv ? "" : "bg-neutral-50"} ${href ? "hover:bg-neutral-50 transition-colors" : ""} text-sm`}>
      <div className={`min-w-0 flex-1 font-medium ${aktiv ? "text-neutral-900" : "text-neutral-400"}`}>
        {navn}
      </div>
      {aktiv ? (
        <LeveransePill status={arveStatus(aktiv, alle)} />
      ) : (
        <AktiverLeveranseButton kundeSlug={kundeSlug} leveranseSlug={leveranseSlug} leveranseNavn={navn} kategori={kategori} />
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

function LeveransePill({ status }: { status: LeveranseStatus }) {
  const kind = status === "godkjent" ? "done" : status === "til_avsjekk" ? "review" : "idle";
  return <Pill kind={kind}>{statusLabel(status)}</Pill>;
}

const PILL_STYLES = {
  done: { bg: "bg-green-50", fg: "text-green-900", dot: "bg-green-500" },
  review: { bg: "bg-yellow-50", fg: "text-yellow-900", dot: "bg-yellow-500" },
  idle: { bg: "bg-neutral-100", fg: "text-neutral-700", dot: "bg-neutral-400" },
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
