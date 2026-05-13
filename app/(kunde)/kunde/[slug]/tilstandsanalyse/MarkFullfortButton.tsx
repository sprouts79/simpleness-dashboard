"use client";

import { useTransition } from "react";
import { markFullfortAction } from "./actions";

export default function MarkFullfortButton({
  slug,
  itemId,
  state,
}: {
  slug: string;
  itemId: string;
  state: string | null;
}) {
  const [pending, startTransition] = useTransition();

  if (state === "ok") return null;
  if (state === "avsjekk") {
    return (
      <span className="text-[11px] font-medium text-purple-900 px-2 py-1 rounded bg-purple-50">
        Sendt til avsjekk
      </span>
    );
  }

  function handle() {
    startTransition(async () => {
      await markFullfortAction(slug, itemId);
    });
  }

  return (
    <button
      onClick={handle}
      disabled={pending}
      className="text-[11px] font-medium px-2.5 py-1 rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-100 disabled:opacity-50 transition-colors whitespace-nowrap"
    >
      {pending ? "Sender …" : "Marker fullført"}
    </button>
  );
}
