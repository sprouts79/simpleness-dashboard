import Link from "next/link";
import { notFound } from "next/navigation";
import { getKunde } from "@/lib/db-kunder";
import { getGodkjent, getItems } from "@/lib/db-tilstandsanalyse";
import {
  GROUPS,
  ITEMS,
  ITEM_STATE_LABEL,
  ITEM_STATE_STYLE,
  TABS,
  stateKey,
  stateSortRank,
  type AuditItemRow,
  type Item,
} from "@/lib/types-tilstandsanalyse";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function KundeTilstandsanalyseKundeView({ params }: PageProps) {
  const { slug } = await params;
  const kunde = await getKunde(slug);
  if (!kunde) notFound();

  const godkjent = await getGodkjent(slug);

  if (!godkjent) {
    return (
      <div>
        <Link href={`/kunde/${slug}`} className="text-xs text-[#515b12] hover:underline mb-3 inline-block">← {kunde.name}</Link>
        <header className="border-b border-neutral-200 pb-8 mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900">Tilstandsanalyse</h1>
          <p className="mt-2 text-neutral-500">Kvartalsvis nullpunktsanalyse</p>
        </header>
        <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
          Tilstandsanalysen er ikke publisert ennå.
        </div>
      </div>
    );
  }

  const items = await getItems(godkjent.id);
  const itemsById: Record<string, AuditItemRow> = Object.fromEntries(items.map((i) => [i.item_id, i]));

  // Tiltaksliste — items med non-OK status, sortert
  const tiltak = items
    .filter((i) => i.state && i.state !== "ok")
    .map((row) => ({ row, item: ITEMS.find((it) => it.id === row.item_id) }))
    .filter((x): x is { row: AuditItemRow; item: Item } => Boolean(x.item))
    .sort((a, b) => stateSortRank(a.row.state) - stateSortRank(b.row.state));

  // Stats
  const counts: Record<string, number> = {};
  for (const i of items) counts[stateKey(i.state)] = (counts[stateKey(i.state)] ?? 0) + 1;
  const totalAssessed = items.filter((i) => i.state !== null).length;
  const totalItems = ITEMS.length;
  const kundeCount = items.filter((i) => i.assignee === "kunde").length;

  return (
    <div>
      <Link href={`/kunde/${slug}`} className="text-xs text-[#515b12] hover:underline mb-3 inline-block">← {kunde.name}</Link>

      <header className="border-b border-neutral-200 pb-8 mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900">Tilstandsanalyse</h1>
        <p className="mt-2 text-neutral-500">
          {godkjent.kvartal} · Sist oppdatert{" "}
          {godkjent.godkjent_dato &&
            new Date(godkjent.godkjent_dato).toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </header>

      {/* Sammendrag */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-px overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200 mb-3">
        {(["ok", "p2", "p1", "wip", "na", "open"] as const).map((k) => (
          <div key={k} className="bg-white p-4">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-neutral-500 font-medium">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${ITEM_STATE_STYLE[k].dot}`} />
              {ITEM_STATE_LABEL[k]}
            </div>
            <div className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 font-mono">
              {counts[k] ?? 0}
              <span className="text-sm font-normal text-neutral-400"> / {k === "open" ? totalItems - totalAssessed : totalItems}</span>
            </div>
          </div>
        ))}
      </div>

      {kundeCount > 0 && (
        <div className="rounded-lg border border-[#515b12]/20 bg-[#515b12]/5 px-4 py-3 text-sm text-[#515b12] mb-10">
          <strong className="font-semibold">{kundeCount} punkter</strong> ligger hos dere å handle på. Markert i listen under.
        </div>
      )}

      {/* Tiltaksliste */}
      {tiltak.length > 0 && (
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Tiltaksliste</h2>
          <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
            {tiltak.map(({ row, item }) => (
              <ItemDisplay key={row.item_id} item={item} row={row} compact />
            ))}
          </div>
        </section>
      )}

      {/* Full liste per fane */}
      {TABS.map((tab) => {
        const tabItems = ITEMS.filter((i) => i.tab === tab.id);
        return (
          <section key={tab.id} className="mb-10">
            <div className="flex items-baseline justify-between mb-4 border-b border-neutral-200 pb-2">
              <h2 className="text-lg font-semibold text-neutral-900">{tab.title}</h2>
              <span className="font-mono text-xs text-neutral-500">{tabItems.length} sjekkpunkter</span>
            </div>
            {GROUPS.filter((g) => g.tab === tab.id).map((group) => {
              const items = ITEMS.filter((i) => i.tab === tab.id && i.group === group.id);
              if (items.length === 0) return null;
              return (
                <div key={group.id} className="mb-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">{group.label}</h3>
                  <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
                    {items.map((item) => (
                      <ItemDisplay key={item.id} item={item} row={itemsById[item.id]} />
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        );
      })}

      <footer className="mt-12 pt-6 border-t border-neutral-200 text-xs text-neutral-400 font-mono">
        Simpleness OS · Tilstandsanalyse {godkjent.kvartal}
      </footer>
    </div>
  );
}

function ItemDisplay({ item, row, compact }: { item: Item; row: AuditItemRow | undefined; compact?: boolean }) {
  const state = row?.state ?? null;
  const style = ITEM_STATE_STYLE[stateKey(state)];
  const note = row?.note;
  const hosKunde = row?.assignee === "kunde";

  return (
    <div className={`flex items-start gap-4 px-5 py-4 border-t border-neutral-200 first:border-t-0 ${hosKunde ? "border-l-2 border-l-[#515b12]" : ""}`}>
      <span className={`mt-1.5 inline-block w-2 h-2 rounded-full ${style.dot} flex-shrink-0`} />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-start justify-between gap-3">
          <div className="text-sm font-medium text-neutral-900 leading-snug">
            <span dangerouslySetInnerHTML={{ __html: item.text }} />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {hosKunde && !compact && (
              <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-white bg-[#515b12] px-1.5 py-0.5 rounded">
                Hos dere
              </span>
            )}
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${style.bg} ${style.fg}`}>
              {ITEM_STATE_LABEL[stateKey(state)]}
            </span>
          </div>
        </div>
        {note && (
          <div className="text-xs text-neutral-600 leading-relaxed">{note}</div>
        )}
        {compact && hosKunde && (
          <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-white bg-[#515b12] px-1.5 py-0.5 rounded inline-block mt-1">
            Hos dere
          </span>
        )}
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const kunde = await getKunde(slug);
  return {
    title: kunde ? `Tilstandsanalyse · ${kunde.name} · Simpleness OS` : "Tilstandsanalyse · Simpleness OS",
  };
}
