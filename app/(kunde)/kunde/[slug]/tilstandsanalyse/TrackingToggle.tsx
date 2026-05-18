"use client";

import { useOptimistic, useTransition } from "react";
import type { TrackingMode } from "@/lib/checklist-data";
import { setTrackingModeAction } from "./actions";

const OPTIONS: Array<{ value: TrackingMode; label: string }> = [
  { value: "gtm", label: "GTM" },
  { value: "shopify", label: "Shopify-integrasjon" },
  { value: "begge", label: "Begge" },
];

export default function TrackingToggle({ slug, mode }: { slug: string; mode: TrackingMode }) {
  const [optimistic, setOptimistic] = useOptimistic<TrackingMode, TrackingMode>(mode, (_, next) => next);
  const [, startTransition] = useTransition();

  function handleChange(next: TrackingMode) {
    if (next === optimistic) return;
    startTransition(async () => {
      setOptimistic(next);
      await setTrackingModeAction(slug, next);
    });
  }

  return (
    <div className="inline-flex rounded-lg border border-neutral-200 bg-white p-0.5">
      {OPTIONS.map((opt) => {
        const active = optimistic === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => handleChange(opt.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              active ? "bg-neutral-900 text-white" : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
