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
import MarkFullfortButton from "./MarkFullfortButton";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

type TabKey = "tiltak" | "oversikt";

export default async function KundeTilstandsanalyseKundeView({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
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

  // Pending "Hos dere" — alt assignee=kunde som ikke er ok eller allerede sendt til avsjekk
  const kundePending = items.filter(
    (i) => i.assignee === "kunde" && i.state !== "ok" && i.state !== "avsjekk",
  ).length;

  // Stats for oversikt
  const counts: Record<string, number> = {};
  for (const i of items) counts[stateKey(i.state)] = (counts[stateKey(i.state)] ?? 0) + 1;
  const totalAssessed = items.filter((i) => i.state !== null).length;
  const totalItems = ITEMS.length;

  const activeTab: TabKey = sp.tab === "oversikt" ? "oversikt" : "tiltak";

  return (
    <div>
      <Link href={`/kunde/${slug}`} className="text-xs text-[#515b12] hover:underline mb-3 inline-block">← {kunde.name}</Link>

      <header className="border-b border-neutral-200 pb-8 mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900">Tilstandsanalyse</h1>
        <p className="mt-2 text-neutral-500">
          {godkjent.kvartal} · Sist oppdatert{" "}
          {godkjent.godkjent_dato &&
            new Date(godkjent.godkjent_dato).toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-neutral-200">
        <TabLink slug={slug} tab="tiltak" active={activeTab === "tiltak"}>
          Tiltaksliste
          {tiltak.length > 0 && (
            <span className="ml-1.5 font-mono text-xs text-neutral-400">{tiltak.length}</span>
          )}
        </TabLink>
        <TabLink slug={slug} tab="oversikt" active={activeTab === "oversikt"}>
          Oversikt
          <span className="ml-1.5 font-mono text-xs text-neutral-400">{totalItems}</span>
        </TabLink>
      </div>

      {activeTab === "tiltak" && (
        <TiltakTab tiltak={tiltak} slug={slug} kundePending={kundePending} />
      )}

      {activeTab === "oversikt" && (
        <OversiktTab counts={counts} totalAssessed={totalAssessed} totalItems={totalItems} itemsById={itemsById} slug={slug} />
      )}

      <footer className="mt-12 pt-6 border-t border-neutral-200 text-xs text-neutral-400 font-mono">
        Simpleness OS · Tilstandsanalyse {godkjent.kvartal}
      </footer>
    </div>
  );
}

function TabLink({
  slug,
  tab,
  active,
  children,
}: {
  slug: string;
  tab: TabKey;
  active: boolean;
  children: React.ReactNode;
}) {
  const href = tab === "tiltak" ? `/kunde/${slug}/tilstandsanalyse` : `/kunde/${slug}/tilstandsanalyse?tab=oversikt`;
  return (
    <Link
      href={href}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
        active
          ? "border-neutral-900 text-neutral-900"
          : "border-transparent text-neutral-500 hover:text-neutral-900"
      }`}
    >
      {children}
    </Link>
  );
}

// ────────────────────────────────────────────────────────────
// Tab: Tiltaksliste
// ────────────────────────────────────────────────────────────

function TiltakTab({
  tiltak,
  slug,
  kundePending,
}: {
  tiltak: { row: AuditItemRow; item: Item }[];
  slug: string;
  kundePending: number;
}) {
  if (tiltak.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center">
        <div className="text-base font-medium text-neutral-900 mb-1">Alt på plass</div>
        <div className="text-sm text-neutral-500">Ingen åpne tiltak akkurat nå.</div>
      </div>
    );
  }

  return (
    <div>
      {kundePending > 0 && (
        <div className="rounded-lg border border-[#515b12]/20 bg-[#515b12]/5 px-4 py-3 text-sm text-[#515b12] mb-6">
          <strong className="font-semibold">{kundePending} {kundePending === 1 ? "punkt" : "punkter"}</strong> ligger hos dere å handle på. Marker fullført når dere har gjort det.
        </div>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        {tiltak.map(({ row, item }) => (
          <ItemDisplay key={row.item_id} item={item} row={row} slug={slug} compact />
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Tab: Oversikt
// ────────────────────────────────────────────────────────────

function OversiktTab({
  counts,
  totalAssessed,
  totalItems,
  itemsById,
  slug,
}: {
  counts: Record<string, number>;
  totalAssessed: number;
  totalItems: number;
  itemsById: Record<string, AuditItemRow>;
  slug: string;
}) {
  return (
    <div>
      {/* Sammendrag */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200 mb-10">
        {(["ok", "avsjekk", "p2", "p1", "wip", "na", "open"] as const).map((k) => (
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
                      <ItemDisplay key={item.id} item={item} row={itemsById[item.id]} slug={slug} />
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Item display
// ────────────────────────────────────────────────────────────

function ItemDisplay({
  item,
  row,
  slug,
  compact,
}: {
  item: Item;
  row: AuditItemRow | undefined;
  slug: string;
  compact?: boolean;
}) {
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
        {hosKunde && (
          <div className="flex items-center gap-2 mt-1">
            {compact && (
              <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-white bg-[#515b12] px-1.5 py-0.5 rounded">
                Hos dere
              </span>
            )}
            <MarkFullfortButton slug={slug} itemId={item.id} state={state} />
          </div>
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
