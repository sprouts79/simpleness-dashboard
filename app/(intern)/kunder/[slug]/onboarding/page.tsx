import Link from "next/link";
import { notFound } from "next/navigation";
import { getKunde } from "@/lib/db-kunder";
import {
  getSessionByClientId,
  getAccess,
  getInsights,
  getDocuments,
  PLATFORMS,
  type OnboardingPlatform,
} from "@/lib/db-onboarding";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function KundeOnboardingPage({ params }: PageProps) {
  const { slug } = await params;
  const kunde = await getKunde(slug);
  if (!kunde) notFound();

  const session = await getSessionByClientId(kunde.id);
  if (!session) {
    return (
      <div className="max-w-3xl">
        <Link href={`/kunder/${slug}`} className="text-xs text-[#515b12] hover:underline mb-3 inline-block">← {kunde.name}</Link>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mb-2">Onboarding</h1>
        <div className="rounded-xl border border-neutral-200 bg-white px-5 py-8 text-sm text-neutral-500 mt-6">
          Ingen onboarding-session opprettet for denne kunden ennå.
        </div>
      </div>
    );
  }

  const [access, insights, documents] = await Promise.all([
    getAccess(session.id),
    getInsights(session.id),
    getDocuments(session.id),
  ]);

  const platformLabel = (p: OnboardingPlatform) => PLATFORMS.find((pp) => pp.id === p)?.navn ?? p;

  return (
    <div className="max-w-3xl">
      <Link href={`/kunder/${slug}`} className="text-xs text-[#515b12] hover:underline mb-3 inline-block">← {kunde.name}</Link>
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Onboarding</h1>
        <p className="text-sm text-neutral-500 mt-1 font-mono">
          Token: {session.token} · {session.completed_at ? "Fullført" : `Steg ${session.current_step} av 3`}
        </p>
      </header>

      <Card title="Tilganger">
        {access.map((a) => (
          <div key={a.id} className="flex items-center justify-between px-5 py-3 border-t border-neutral-200 first:border-t-0 text-sm">
            <div className="flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${a.completed ? "bg-green-500" : "bg-neutral-300"}`} />
              <span className="text-neutral-900">{platformLabel(a.platform)}</span>
              {!a.required && <span className="text-[10px] uppercase tracking-wider text-neutral-400">Valgfri</span>}
            </div>
            <span className="text-xs text-neutral-500">
              {a.completed ? `Fullført ${a.completed_at?.slice(0, 10)}` : "Ikke fullført"}
            </span>
          </div>
        ))}
      </Card>

      <Card title="Innsikt">
        {!insights || !insights.submitted_at ? (
          <div className="px-5 py-6 text-sm text-neutral-500">Ikke sendt inn ennå</div>
        ) : (
          <div className="px-5 py-5 space-y-5 text-sm">
            <Section title="Salgsmål og enhetsøkonomi" hint="ekskl. mva">
              <Field label="Fjoråret" value={fmtKr(insights.salgsmal_fjoraret_nok)} />
              <Field label="Vekstmål" value={fmtPct(insights.salgsmal_vekstmal_pct)} />
              <Field label="Salgsmål i år" value={fmtKr(insights.salgsmal_iar_nok)} />
              <Field label="Omsetning per kunde · første ordre" value={fmtKr(insights.omsetning_forste_ordre_nok)} />
              <Field label="Omsetning per kunde · 6 mndr" value={fmtKr(insights.omsetning_6mnd_nok)} />
              <Field label="Omsetning per kunde · 12 mndr" value={fmtKr(insights.omsetning_12mnd_nok)} />
              <Field label="Andel nye kunder" value={fmtPct(insights.andel_nye_kunder_pct)} />
              <Field label="Varekost" value={fmtPct(insights.varekost_pct)} />
              <Field label="Frakt" value={fmtPct(insights.frakt_pct)} />
              <Field label="Transaksjonsgebyr" value={fmtPct(insights.transaksjonsgebyr_pct)} />
              <Field label="Mkt-spend årlig" value={fmtKr(insights.mkt_spend_arlig_nok)} />
              <Field label="Mkt-produksjon årlig" value={fmtKr(insights.mkt_produksjon_arlig_nok)} />
            </Section>
            <Section title="Forretning og mål">
              <Field label="Forretnings- og markedsmål" value={insights.forretningsmal} />
              <Field label="Omsetningsmål" value={insights.omsetningsmal} />
              <Field label="Hva er viktigst" value={insights.prioritet} />
              <Field label="Største utfordringer" value={insights.utfordringer} />
            </Section>
            <Section title="Målgruppe og posisjonering">
              <Field label="Målgruppe og kundeinnsikt" value={insights.malgruppe} />
              <Field label="Konkurrenter" value={insights.konkurrenter} />
              <Field label="Referanser og anti-referanser" value={insights.referanser_anti} />
              <Field label="Ambassadører og kreatører" value={insights.ambassadorer_kreatorer} />
            </Section>
            <Section title="Produkt og pris">
              <Field label="Prioriterte produkter" value={insights.prioriterte_produkter} />
              <Field label="Snittordre" value={insights.snittordre_nok ? `${insights.snittordre_nok} NOK` : null} />
              <Field label="Sesongvariasjoner" value={insights.sesongvariasjoner} />
              <Field label="Rabatter, bundles, kampanjer" value={insights.rabatter_bundles} />
            </Section>
            <Section title="Økonomi og nøkkeltall">
              <Field label="Månedlig annonsebudsjett" value={insights.manedlig_annonsebudsjett_nok ? `${insights.manedlig_annonsebudsjett_nok} NOK / mnd` : null} />
              <Field label="KPI-er" value={insights.kpis?.join(", ") ?? null} />
            </Section>
            <Section title="Avslutning">
              <Field label="Slack-medlemmer" value={insights.slack_medlemmer} />
              <Field label="Hvordan ser suksess ut" value={insights.suksess_definisjon} />
              <Field label="Noe mer" value={insights.noe_mer} />
            </Section>
          </div>
        )}
      </Card>

      <Card title={`Dokumenter${documents.length ? ` (${documents.length})` : ""}`}>
        {documents.length === 0 ? (
          <div className="px-5 py-6 text-sm text-neutral-500">Ingen dokumenter</div>
        ) : (
          documents.map((d) => {
            const isLink = Boolean(d.link_url);
            const href = isLink ? d.link_url! : `/api/onboarding/document/${d.id}`;
            return (
              <div key={d.id} className="flex items-center justify-between gap-4 px-5 py-3 border-t border-neutral-200 first:border-t-0 text-sm">
                <a
                  href={href}
                  target={isLink ? "_blank" : undefined}
                  rel={isLink ? "noreferrer" : undefined}
                  className="text-[#515b12] hover:underline truncate min-w-0 flex items-center gap-2"
                >
                  <span className="text-xs text-neutral-400 uppercase tracking-wider w-10 flex-shrink-0">
                    {isLink ? "Lenke" : "Fil"}
                  </span>
                  <span className="truncate">{d.filename}</span>
                </a>
                <span className="text-xs text-neutral-500 font-mono whitespace-nowrap">
                  {isLink ? "↗" : d.size_bytes ? `${Math.round(d.size_bytes / 1024)} KB ↓` : "↓"}
                </span>
              </div>
            );
          })
        )}
      </Card>
    </div>
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

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
        {title}
        {hint && <span className="ml-2 text-[10px] font-normal text-neutral-400 normal-case tracking-normal">{hint}</span>}
      </h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function fmtKr(n: number | string | null | undefined): string | null {
  if (n === null || n === undefined || n === "") return null;
  const num = typeof n === "number" ? n : parseFloat(String(n));
  if (!Number.isFinite(num)) return null;
  return `${num.toLocaleString("nb-NO").replace(/,/g, " ")} kr`;
}

function fmtPct(n: number | string | null | undefined): string | null {
  if (n === null || n === undefined || n === "") return null;
  const num = typeof n === "number" ? n : parseFloat(String(n));
  if (!Number.isFinite(num)) return null;
  return `${String(num).replace(".", ",")} %`;
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="grid grid-cols-[180px_1fr] gap-4 text-sm">
      <span className="text-neutral-500">{label}</span>
      <span className="text-neutral-900 whitespace-pre-wrap">{value || <span className="text-neutral-400">—</span>}</span>
    </div>
  );
}
