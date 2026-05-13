import Link from "next/link";
import { notFound } from "next/navigation";
import { hentKundeomrade } from "@/lib/clients-leveranser";
import {
  hentAuditState,
  ITEMS,
  GROUPS,
  TABS,
  type ItemTab,
  type ItemState,
  type AuditItemResult,
} from "@/lib/tilstandsanalyse-data";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function TilstandsanalysePage({ params }: PageProps) {
  const { slug } = await params;
  const kunde = hentKundeomrade(slug);
  const audit = hentAuditState(slug);

  if (!kunde || !audit) {
    notFound();
  }

  // Count by state
  const counts = countByState(audit.items);
  const kundeCount = Object.values(audit.items).filter((r) => r.assignee === "kunde").length;

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <Link
          href={`/kunde/${slug}`}
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900"
        >
          ← {kunde.navn}
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Tilstandsanalyse</h1>
        <p className="text-sm text-neutral-500">
          Q{audit.kvartal.split("-Q")[1]} {audit.kvartal.split("-")[0]} ·{" "}
          <span className="font-mono text-xs">{formatDate(audit.sist_oppdatert)}</span>
        </p>
      </div>

      <SummaryGrid counts={counts} total={ITEMS.length} kundeCount={kundeCount} />

      {(Object.keys(TABS) as ItemTab[]).map((tabId) => (
        <Section
          key={tabId}
          title={TABS[tabId].title}
          tabId={tabId}
          items={audit.items}
        />
      ))}
    </div>
  );
}

function SummaryGrid({
  counts,
  total,
  kundeCount,
}: {
  counts: Record<string, number>;
  total: number;
  kundeCount: number;
}) {
  const cells = [
    { key: "s-ok", label: "OK", color: "bg-emerald-500" },
    { key: "s-p2", label: "Bør forbedres", color: "bg-amber-500" },
    { key: "s-p1", label: "Kritisk", color: "bg-rose-500" },
    { key: "s-wip", label: "Jobbes med", color: "bg-sky-500" },
    { key: "s-na", label: "Mangler tilgang", color: "bg-neutral-400" },
    { key: "open", label: "Ikke vurdert", color: "bg-neutral-200" },
  ];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-px overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200">
        {cells.map((c) => (
          <div key={c.key} className="bg-white p-4">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-neutral-500 font-medium">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${c.color}`} />
              {c.label}
            </div>
            <div className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 font-mono">
              {counts[c.key] ?? 0}
              <span className="text-sm font-normal text-neutral-400"> / {total}</span>
            </div>
          </div>
        ))}
      </div>
      {kundeCount > 0 && (
        <div className="rounded-lg border border-[#515B12]/20 bg-[#515B12]/5 px-4 py-3 text-sm text-[#515B12]">
          <strong className="font-semibold">{kundeCount} punkter</strong> ligger hos dere å handle på. Markert i listen under.
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  tabId,
  items,
}: {
  title: string;
  tabId: ItemTab;
  items: Record<string, AuditItemResult>;
}) {
  const groups = GROUPS.filter((g) => g.tab === tabId);
  const sectionItems = ITEMS.filter((i) => i.tab === tabId);
  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between border-b border-neutral-200 pb-2">
        <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
        <span className="font-mono text-xs text-neutral-500">{sectionItems.length} sjekkpunkter</span>
      </div>
      {groups.map((g) => {
        const inGroup = ITEMS.filter((i) => i.tab === tabId && i.g === g.id);
        if (inGroup.length === 0) return null;
        return (
          <div key={g.id} className="space-y-2">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500">{g.label}</div>
            <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
              {inGroup.map((item, idx) => (
                <ItemRow
                  key={item.id}
                  title={item.t}
                  result={items[item.id] ?? { state: null, note: "", assignee: null }}
                  isFirst={idx === 0}
                />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function ItemRow({
  title,
  result,
  isFirst,
}: {
  title: string;
  result: AuditItemResult;
  isFirst: boolean;
}) {
  const stateKey = result.state ?? "open";
  const stateMap: Record<string, { dot: string; label: string; pillBg: string; pillFg: string }> = {
    "s-ok": { dot: "bg-emerald-500", label: "OK", pillBg: "bg-emerald-50", pillFg: "text-emerald-700" },
    "s-p2": { dot: "bg-amber-500", label: "Bør forbedres", pillBg: "bg-amber-50", pillFg: "text-amber-700" },
    "s-p1": { dot: "bg-rose-500", label: "Kritisk", pillBg: "bg-rose-50", pillFg: "text-rose-700" },
    "s-wip": { dot: "bg-sky-500", label: "Jobbes med", pillBg: "bg-sky-50", pillFg: "text-sky-700" },
    "s-na": { dot: "bg-neutral-400", label: "Mangler tilgang", pillBg: "bg-neutral-100", pillFg: "text-neutral-700" },
    open: { dot: "bg-neutral-200", label: "Ikke vurdert", pillBg: "bg-neutral-50", pillFg: "text-neutral-500" },
  };
  const st = stateMap[stateKey]!;
  const isKunde = result.assignee === "kunde";

  return (
    <div
      className={`flex items-start gap-4 px-5 py-4 ${isFirst ? "" : "border-t border-neutral-200"} ${
        isKunde ? "border-l-2 border-l-[#515B12]" : ""
      }`}
    >
      <span className={`mt-1.5 inline-block w-2 h-2 rounded-full ${st.dot} flex-shrink-0`} />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-start justify-between gap-3">
          <div className="text-sm font-medium text-neutral-900 leading-snug">{title}</div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isKunde && (
              <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-white bg-[#515B12] px-1.5 py-0.5 rounded">
                Hos dere
              </span>
            )}
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${st.pillBg} ${st.pillFg}`}>
              {st.label}
            </span>
          </div>
        </div>
        {result.note && (
          <div className="text-xs text-neutral-600 leading-relaxed pl-0">{result.note}</div>
        )}
      </div>
    </div>
  );
}

function countByState(items: Record<string, AuditItemResult>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of Object.values(items)) {
    const key = r.state ?? "open";
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" });
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const kunde = hentKundeomrade(slug);
  return {
    title: kunde ? `Tilstandsanalyse · ${kunde.navn} · Simpleness OS` : "Tilstandsanalyse · Simpleness OS",
  };
}
