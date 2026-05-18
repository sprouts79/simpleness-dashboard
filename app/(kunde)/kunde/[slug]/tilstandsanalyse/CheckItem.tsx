"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import type { CheckItem as CheckItemData, Priority } from "@/lib/checklist-data";
import { PRIORITY_LABEL } from "@/lib/checklist-data";
import type { ItemResponse, ItemState } from "@/lib/db-tilstandsanalyse";
import {
  setItemAssigneeAction,
  setItemNoteAction,
  setItemStateAction,
} from "./actions";

type StateKey = "open" | ItemState;

const STATE_OPTIONS: Array<{ key: StateKey; value: ItemState | null; label: string; dot: string }> = [
  { key: "open", value: null, label: "Åpen", dot: "bg-neutral-300" },
  { key: "wip", value: "wip", label: "Jobbes med", dot: "bg-blue-500" },
  { key: "ok", value: "ok", label: "OK", dot: "bg-[#41bd0e]" },
  { key: "na", value: "na", label: "Mangler tilgang", dot: "bg-neutral-400" },
];

const STATE_STYLE: Record<StateKey, { bg: string; cb: string; cbBorder: string; cbIcon: string }> = {
  open: { bg: "bg-white", cb: "bg-white", cbBorder: "border-neutral-300", cbIcon: "text-neutral-400" },
  wip: { bg: "bg-blue-50/60", cb: "bg-blue-500", cbBorder: "border-blue-500", cbIcon: "text-white" },
  ok: { bg: "bg-green-50/60", cb: "bg-[#41bd0e]", cbBorder: "border-[#41bd0e]", cbIcon: "text-white" },
  na: { bg: "bg-neutral-50", cb: "bg-neutral-200", cbBorder: "border-neutral-400", cbIcon: "text-neutral-700" },
};

const PRIORITY_PILL: Record<Priority, { bg: string; fg: string }> = {
  must: { bg: "bg-red-50", fg: "text-red-700" },
  recommended: { bg: "bg-neutral-100", fg: "text-neutral-700" },
  optional: { bg: "bg-transparent border border-neutral-200", fg: "text-neutral-400" },
};

function stateKey(s: ItemState | null): StateKey {
  return s ?? "open";
}

function stateIcon(key: StateKey): string {
  switch (key) {
    case "ok": return "✓";
    case "wip": return "⏳";
    case "na": return "–";
    case "open": return "○";
  }
}

interface Props {
  slug: string;
  quarter: string;
  item: CheckItemData;
  initial: ItemResponse;
  disabled?: boolean;
}

export default function CheckItem({ slug, quarter, item, initial, disabled }: Props) {
  const [stateOpt, setStateOpt] = useOptimistic<ItemState | null, ItemState | null>(initial.state, (_, next) => next);
  const [assigneeOpt, setAssigneeOpt] = useOptimistic<"kunde" | null, "kunde" | null>(initial.assignee, (_, next) => next);
  const [noteValue, setNoteValue] = useState<string>(initial.note ?? "");
  const [, startTransition] = useTransition();

  const [openStatus, setOpenStatus] = useState(false);
  const [openNote, setOpenNote] = useState(false);
  const statusRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setOpenStatus(false);
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);

  function changeState(next: ItemState | null) {
    setOpenStatus(false);
    if (disabled || next === stateOpt) return;
    startTransition(async () => {
      setStateOpt(next);
      await setItemStateAction(slug, quarter, item.id, next);
    });
  }

  function changeAssignee() {
    if (disabled) return;
    const next = assigneeOpt === "kunde" ? null : "kunde";
    startTransition(async () => {
      setAssigneeOpt(next);
      await setItemAssigneeAction(slug, quarter, item.id, next);
    });
  }

  function saveNote() {
    const trimmed = noteValue.trim();
    const stored = initial.note ?? "";
    if (trimmed === stored.trim()) return;
    void setItemNoteAction(slug, quarter, item.id, trimmed.length === 0 ? null : trimmed);
  }

  const key = stateKey(stateOpt);
  const style = STATE_STYLE[key];
  const priority = item.priority && PRIORITY_PILL[item.priority];
  const isKunde = assigneeOpt === "kunde";
  const hasNote = (noteValue ?? "").trim().length > 0;

  return (
    <div className={`border-t border-neutral-200 first:border-t-0 transition-colors ${style.bg} ${isKunde ? "border-l-2 border-l-[#515b12]" : ""}`}>
      <div className="grid grid-cols-[28px_1fr_auto] gap-3 px-5 py-3.5 items-start">
        <div className="relative" ref={statusRef}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); if (!disabled) setOpenStatus((v) => !v); }}
            disabled={disabled}
            className={`w-7 h-7 rounded-md border-1.5 flex items-center justify-center text-[12px] font-bold leading-none ${style.cb} ${style.cbBorder} ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:opacity-80"} ${style.cbIcon}`}
            aria-label={`Status: ${STATE_OPTIONS.find((o) => o.key === key)!.label}`}
          >
            {stateIcon(key)}
          </button>
          {openStatus && (
            <div className="absolute top-9 left-0 z-30 min-w-[170px] bg-white border border-neutral-200 rounded-lg shadow-md p-1">
              {STATE_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); changeState(opt.value); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-sm rounded-md text-left hover:bg-neutral-100"
                >
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${opt.dot}`} />
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div
            className="text-sm font-medium text-neutral-900 leading-snug"
            dangerouslySetInnerHTML={{ __html: formatBackticks(item.label) }}
          />
          {item.note && <div className="text-xs italic text-neutral-500 mt-0.5">{item.note}</div>}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {priority && (
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${priority.bg} ${priority.fg}`}>
              {PRIORITY_LABEL[item.priority!]}
            </span>
          )}
          <button
            type="button"
            onClick={changeAssignee}
            disabled={disabled}
            className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border transition-colors ${
              isKunde ? "bg-[#515b12] text-white border-[#515b12]" : "border-neutral-200 text-neutral-400 hover:text-neutral-700 hover:border-neutral-400"
            }`}
          >
            Kunde
          </button>
          <button
            type="button"
            onClick={() => setOpenNote((v) => !v)}
            className={`text-[11px] flex items-center gap-1 ${hasNote ? "text-[#515b12] font-medium" : "text-neutral-500 hover:text-neutral-900"}`}
          >
            <span className={`inline-block text-[9px] transition-transform ${openNote ? "rotate-90" : ""}`}>▶</span>
            Notat
          </button>
        </div>
      </div>

      {!openNote && hasNote && (
        <button
          type="button"
          onClick={() => setOpenNote(true)}
          className="mb-3 mx-5 ml-[52px] px-3 py-2 text-left text-[13px] text-neutral-700 bg-white/60 border-l-2 border-[#515b12] rounded-r block w-[calc(100%-72px)] hover:bg-white whitespace-pre-wrap"
        >
          {noteValue}
        </button>
      )}

      {openNote && (
        <div className="px-5 pb-3 pl-[52px]">
          <textarea
            className="w-full text-[13px] text-neutral-900 bg-white border border-neutral-200 rounded-md px-2.5 py-2 outline-none focus:border-neutral-500 resize-y min-h-[60px]"
            placeholder="Funn, kontekst, oppfølging…"
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
            onBlur={saveNote}
            autoFocus={openNote && !hasNote}
          />
        </div>
      )}
    </div>
  );
}

function formatBackticks(text: string): string {
  const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escaped.replace(/`([^`]+)`/g, '<code class="font-mono text-[12px] bg-neutral-100 px-1 py-0.5 rounded">$1</code>');
}
