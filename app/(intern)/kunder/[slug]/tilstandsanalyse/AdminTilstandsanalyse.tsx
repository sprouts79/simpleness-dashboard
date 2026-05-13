"use client";

import { useState, useTransition } from "react";
import {
  TABS,
  GROUPS,
  ITEMS,
  ITEM_STATE_LABEL,
  ITEM_STATE_STYLE,
  PRIORITY_LABEL,
  stateKey,
  stateSortRankAdmin,
  versjonLabel,
  type AuditState,
  type AuditItemRow,
  type AuditItemState,
  type Item,
} from "@/lib/types-tilstandsanalyse";
import {
  startDraftAction,
  setItemAction,
  approveAction,
  reopenAction,
} from "./actions";

interface Props {
  slug: string;
  kundeNavn: string;
  simplenessKontakt: string;
  draft: AuditState | null;
  godkjent: AuditState | null;
  itemsById: Record<string, AuditItemRow>;
}

const ITEM_STATE_OPTIONS: AuditItemState[] = [null, "p1", "p2", "wip", "avsjekk", "na", "ok"];

export default function AdminTilstandsanalyse(props: Props) {
  const aktiv = props.draft ?? props.godkjent;
  const [pending, startTransition] = useTransition();

  function handleStart() {
    startTransition(async () => {
      await startDraftAction(props.slug);
    });
  }

  function handleApprove() {
    if (!props.draft) return;
    if (!confirm(`Godkjenn denne versjonen og publiser til kunde-områdets tilstandsanalyse?`)) return;
    startTransition(async () => {
      await approveAction(props.slug, props.draft!.id, props.simplenessKontakt);
    });
  }

  function handleReopen() {
    if (!props.godkjent) return;
    if (!confirm(`Tilbakefør godkjent versjon til draft? Den forsvinner fra kundens visning.`)) return;
    startTransition(async () => {
      await reopenAction(props.slug, props.godkjent!.id);
    });
  }

  if (!aktiv) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center">
        <h2 className="text-base font-semibold text-neutral-900 mb-2">Ingen tilstandsanalyse opprettet ennå</h2>
        <p className="text-sm text-neutral-500 mb-6">
          Start en ny draft for å begynne å registrere status for kvartalet.
        </p>
        <button
          onClick={handleStart}
          disabled={pending}
          className="px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-black disabled:opacity-40"
        >
          {pending ? "Starter …" : "Start ny draft"}
        </button>
      </div>
    );
  }

  // Godkjent er fortsatt redigerbar slik at admin lett kan flytte 'avsjekk' → 'ok' uten omveier.
  const isEditable = true;

  // Items med state, samlet
  const allRows = ITEMS.map((item) => ({ item, row: props.itemsById[item.id] }));

  // Tiltaksliste — alt som ikke er OK (eller åpent uten state)
  const tiltakItems = allRows
    .filter(({ row }) => row?.state && row.state !== "ok")
    .sort((a, b) => stateSortRankAdmin(a.row!.state) - stateSortRankAdmin(b.row!.state));

  // "Trenger din avsjekk" — egen liten seksjon for prominent visning
  const avsjekkItems = tiltakItems.filter((x) => x.row!.state === "avsjekk");

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-6 px-5 py-3 rounded-xl border border-neutral-200 bg-white">
        <div className="flex items-center gap-3 text-sm">
          <VersjonPill versjon={aktiv.versjon} />
          <span className="text-neutral-500 font-mono text-xs">{aktiv.kvartal}</span>
          {props.godkjent && aktiv.versjon !== "godkjent" && (
            <span className="text-neutral-400 text-xs">· Forrige godkjent: {props.godkjent.kvartal}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(aktiv.versjon === "draft" || aktiv.versjon === "under_review") && (
            <button
              onClick={handleApprove}
              disabled={pending}
              className="px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-black disabled:opacity-40"
            >
              Godkjenn versjon {aktiv.kvartal}
            </button>
          )}
          {aktiv.versjon === "godkjent" && (
            <button
              onClick={handleReopen}
              disabled={pending}
              className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-600 hover:bg-neutral-100 disabled:opacity-40"
            >
              Tilbakefør til draft
            </button>
          )}
          {!props.draft && props.godkjent && (
            <button
              onClick={handleStart}
              disabled={pending}
              className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-600 hover:bg-neutral-100 disabled:opacity-40"
            >
              Start ny draft (nytt kvartal)
            </button>
          )}
        </div>
      </div>

      {/* Trenger din avsjekk */}
      {avsjekkItems.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-neutral-900 mb-3">
            Trenger din avsjekk
            <span className="font-mono text-xs text-neutral-500 ml-2">{avsjekkItems.length}</span>
          </h2>
          <div className="rounded-xl border border-purple-200 bg-white overflow-hidden">
            {avsjekkItems.map(({ item, row }) => (
              <ItemRow key={item.id} item={item} row={row} slug={props.slug} stateId={aktiv.id} editable={isEditable} />
            ))}
          </div>
        </section>
      )}

      {/* Tiltaksliste — alt øvrig som ikke er OK */}
      {tiltakItems.filter((x) => x.row!.state !== "avsjekk").length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-neutral-900 mb-3">
            Tiltaksliste
            <span className="font-mono text-xs text-neutral-500 ml-2">
              {tiltakItems.filter((x) => x.row!.state !== "avsjekk").length}
            </span>
          </h2>
          <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
            {tiltakItems
              .filter((x) => x.row!.state !== "avsjekk")
              .map(({ item, row }) => (
                <ItemRow key={item.id} item={item} row={row} slug={props.slug} stateId={aktiv.id} editable={isEditable} />
              ))}
          </div>
        </section>
      )}

      {/* Full liste per seksjon */}
      {TABS.map((tab) => {
        const tabItems = ITEMS.filter((i) => i.tab === tab.id);
        const assessed = tabItems.filter((i) => props.itemsById[i.id]?.state).length;
        return (
          <section key={tab.id} className="mb-10">
            <div className="flex items-baseline justify-between mb-4 border-b border-neutral-200 pb-2">
              <h2 className="text-lg font-semibold text-neutral-900">{tab.title}</h2>
              <span className="font-mono text-xs text-neutral-500">{assessed}/{tabItems.length} vurdert</span>
            </div>
            {GROUPS.filter((g) => g.tab === tab.id).map((group) => {
              const items = ITEMS.filter((i) => i.tab === tab.id && i.group === group.id);
              if (items.length === 0) return null;
              return (
                <div key={group.id} className="mb-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">{group.label}</h3>
                  <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
                    {items.map((item) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        row={props.itemsById[item.id]}
                        slug={props.slug}
                        stateId={aktiv.id}
                        editable={isEditable}
                      />
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
// Item row
// ────────────────────────────────────────────────────────────

function ItemRow({
  item,
  row,
  slug,
  stateId,
  editable,
}: {
  item: Item;
  row: AuditItemRow | undefined;
  slug: string;
  stateId: string;
  editable: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [, startTransition] = useTransition();

  const state = row?.state ?? null;
  const note = row?.note ?? "";
  const assignee = row?.assignee ?? null;
  const style = ITEM_STATE_STYLE[stateKey(state)];

  function setState(s: AuditItemState) {
    if (!editable) return;
    startTransition(async () => {
      await setItemAction(slug, stateId, item.id, { state: s, note, assignee });
    });
  }

  function setNote(value: string) {
    if (!editable) return;
    startTransition(async () => {
      await setItemAction(slug, stateId, item.id, { state, note: value || null, assignee });
    });
  }

  function setAssignee(value: "kunde" | null) {
    if (!editable) return;
    startTransition(async () => {
      await setItemAction(slug, stateId, item.id, { state, note, assignee: value });
    });
  }

  return (
    <div className="border-t border-neutral-200 first:border-t-0">
      <div
        onClick={() => setExpanded(!expanded)}
        className={`flex items-start gap-3 px-5 py-3.5 cursor-pointer hover:opacity-90 ${style.bg}`}
      >
        <span className={`w-2 h-2 rounded-full mt-2 ${style.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="text-sm text-neutral-900 leading-snug">
            <span dangerouslySetInnerHTML={{ __html: item.text }} />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">{item.id}</span>
            <span className="text-[10px] uppercase tracking-wider text-neutral-400">{PRIORITY_LABEL[item.priority]}</span>
            {assignee === "kunde" && <span className="text-[10px] uppercase tracking-wider text-neutral-700 px-1.5 py-0.5 bg-neutral-100 rounded">Hos kunde</span>}
            {row?.auto && <span className="text-[10px] uppercase tracking-wider text-neutral-400">auto</span>}
          </div>
        </div>
        <span className={`text-[11px] font-medium uppercase tracking-wider px-2 py-1 rounded ${style.fg}`}>
          {ITEM_STATE_LABEL[stateKey(state)]}
        </span>
        <span className="text-xs text-neutral-400 font-mono">{expanded ? "−" : "+"}</span>
      </div>

      {expanded && (
        <div className="px-5 py-4 pl-12 bg-neutral-50 border-t border-neutral-200 space-y-4">
          {item.hint && (
            <div className="text-xs text-neutral-600 leading-relaxed">
              <span dangerouslySetInnerHTML={{ __html: item.hint }} />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">Status</label>
            <div className="flex flex-wrap gap-2">
              {ITEM_STATE_OPTIONS.map((s) => {
                const k = stateKey(s);
                const sty = ITEM_STATE_STYLE[k];
                const active = state === s;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setState(s)}
                    disabled={!editable}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-colors disabled:opacity-50 ${
                      active ? `${sty.bg} ${sty.fg} border-current` : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${sty.dot}`} />
                    {ITEM_STATE_LABEL[k]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">Notat</label>
            <textarea
              defaultValue={note}
              onBlur={(e) => e.target.value !== note && setNote(e.target.value)}
              disabled={!editable}
              placeholder="Kort observasjon, evidens, eller hva som må skje."
              className="w-full min-h-[60px] resize-y rounded-lg border border-neutral-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-neutral-400 disabled:bg-neutral-100 disabled:text-neutral-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={assignee === "kunde"}
                onChange={(e) => setAssignee(e.target.checked ? "kunde" : null)}
                disabled={!editable}
                className="w-4 h-4"
              />
              Hos kunde
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

function VersjonPill({ versjon }: { versjon: AuditState["versjon"] }) {
  const styles = {
    draft:        { bg: "bg-neutral-100", fg: "text-neutral-700", dot: "bg-neutral-400" },
    under_review: { bg: "bg-yellow-50",   fg: "text-yellow-900",  dot: "bg-yellow-500" },
    godkjent:     { bg: "bg-green-50",    fg: "text-green-900",   dot: "bg-green-500" },
    arkivert:     { bg: "bg-neutral-100", fg: "text-neutral-500", dot: "bg-neutral-300" },
  } as const;
  const s = styles[versjon];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.bg} ${s.fg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {versjonLabel(versjon)}
    </span>
  );
}
