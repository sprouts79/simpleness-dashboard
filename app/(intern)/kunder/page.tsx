import Link from "next/link";
import {
  getKunder,
  lifecycleStageLabel,
  lifecycleStagePillClass,
  type Kunde,
} from "@/lib/db-kunder";

export const metadata = {
  title: "Kunder · Simpleness OS",
};

const FILTER_LABELS: { key: string; label: string; predicate: (k: Kunde) => boolean }[] = [
  { key: "alle",        label: "Alle",       predicate: () => true },
  { key: "onboarding",  label: "Onboarding", predicate: (k) => k.lifecycle_stage.startsWith("onboarding_") },
  { key: "aktive",      label: "Aktive",     predicate: (k) => k.lifecycle_stage === "aktiv" },
  { key: "arkiverte",   label: "Arkiverte",  predicate: (k) => k.lifecycle_stage === "arkivert" },
];

export default async function KunderPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const sp = await searchParams;
  const activeFilter = FILTER_LABELS.find((f) => f.key === sp.filter) ?? FILTER_LABELS[0];

  const kunder = await getKunder();
  const visible = kunder.filter(activeFilter.predicate);

  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Kunder</h1>
        <Link
          href="/kunder/ny"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-black transition-colors"
        >
          + Ny kunde
        </Link>
      </header>

      <div className="flex flex-wrap gap-2 mb-5">
        {FILTER_LABELS.map((f) => {
          const active = f.key === activeFilter.key;
          return (
            <Link
              key={f.key}
              href={f.key === "alle" ? "/kunder" : `/kunder?filter=${f.key}`}
              className={`px-3.5 py-1.5 rounded-full border text-sm transition-colors ${
                active
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        <div className="grid grid-cols-[1.6fr_1.8fr_1.4fr_1fr_1fr] px-5 py-3 bg-neutral-50 border-b border-neutral-200 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
          <div>Kunde</div>
          <div>Stage</div>
          <div>Sist aktiv</div>
          <div>Rådgiver</div>
          <div></div>
        </div>

        {visible.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-neutral-500">Ingen kunder i denne kategorien</div>
        ) : (
          visible.map((k) => <KundeRow key={k.id} kunde={k} />)
        )}
      </div>
    </div>
  );
}

function KundeRow({ kunde }: { kunde: Kunde }) {
  const stagePill = lifecycleStagePillClass(kunde.lifecycle_stage);
  const stageText = lifecycleStageLabel(kunde.lifecycle_stage);

  return (
    <div className="grid grid-cols-[1.6fr_1.8fr_1.4fr_1fr_1fr] px-5 py-3.5 border-t border-neutral-200 first:border-t-0 items-center text-sm">
      <div className="font-medium text-neutral-900">{kunde.name}</div>
      <div>
        <Pill kind={stagePill}>{stageText}</Pill>
      </div>
      <div className="text-xs text-neutral-500 font-mono">
        {formatRelative(kunde.created_at)}
      </div>
      <div className="text-xs text-neutral-500 font-mono">
        {kunde.simpleness_contact ?? "—"}
      </div>
      <div>
        <Link href={`/kunder/${kunde.slug}`} className="text-xs text-[#515b12] hover:underline">
          Åpne →
        </Link>
      </div>
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

function formatRelative(iso: string): string {
  const created = new Date(iso);
  const diffMs = Date.now() - created.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return "i dag";
  if (days === 1) return "i går";
  if (days < 30) return `${days} dager siden`;
  const months = Math.floor(days / 30);
  return `${months} mnd siden`;
}

