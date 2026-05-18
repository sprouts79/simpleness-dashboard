"use client";

import { useOptimistic, useTransition } from "react";
import type { CheckItem as CheckItemData, Priority } from "@/lib/checklist-data";
import { setItemCheckedAction } from "./actions";

const PRIORITY_PILL: Record<Priority, { bg: string; fg: string; label: string }> = {
  p1: { bg: "bg-red-50", fg: "text-red-700", label: "P1" },
  p2: { bg: "bg-yellow-50", fg: "text-yellow-800", label: "P2" },
  hygiene: { bg: "bg-neutral-100", fg: "text-neutral-600", label: "Hygiene" },
  viktig: { bg: "bg-blue-50", fg: "text-blue-700", label: "Viktig" },
};

interface Props {
  slug: string;
  quarter: string;
  item: CheckItemData;
  initialChecked: boolean;
  disabled?: boolean;
}

export default function CheckItem({ slug, quarter, item, initialChecked, disabled }: Props) {
  const [optimistic, setOptimistic] = useOptimistic<boolean, boolean>(initialChecked, (_, next) => next);
  const [, startTransition] = useTransition();

  function handleToggle() {
    if (disabled) return;
    const next = !optimistic;
    startTransition(async () => {
      setOptimistic(next);
      await setItemCheckedAction(slug, quarter, item.id, next);
    });
  }

  const priority = item.priority && PRIORITY_PILL[item.priority];

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled}
      className={`group w-full flex items-start gap-3 px-5 py-3.5 text-left border-t border-neutral-200 first:border-t-0 transition-colors ${
        disabled ? "cursor-not-allowed opacity-50" : "hover:bg-neutral-50 cursor-pointer"
      }`}
    >
      <span
        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-1.5 flex items-center justify-center transition-colors ${
          optimistic
            ? "bg-[#41bd0e] border-[#41bd0e] text-white"
            : "bg-white border-neutral-300 group-hover:border-neutral-500"
        }`}
        aria-hidden
      >
        {optimistic && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="min-w-0 flex-1 space-y-1">
        <span
          className={`block text-sm leading-snug ${
            optimistic ? "text-neutral-400 line-through decoration-neutral-300" : "text-neutral-900"
          }`}
          dangerouslySetInnerHTML={{ __html: formatBackticks(item.label) }}
        />
        {item.note && (
          <span className="block text-xs italic text-neutral-500 leading-relaxed">{item.note}</span>
        )}
      </span>
      {priority && (
        <span
          className={`flex-shrink-0 mt-0.5 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${priority.bg} ${priority.fg}`}
        >
          {priority.label}
        </span>
      )}
    </button>
  );
}

// Konverter `kode` → <code>kode</code> for visning
function formatBackticks(text: string): string {
  const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escaped.replace(/`([^`]+)`/g, '<code class="font-mono text-[12px] bg-neutral-100 px-1 py-0.5 rounded">$1</code>');
}
