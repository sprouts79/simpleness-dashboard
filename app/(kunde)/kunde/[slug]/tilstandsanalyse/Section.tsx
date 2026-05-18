"use client";

import { useState } from "react";
import type { Section as SectionData, TrackingMode } from "@/lib/checklist-data";
import CheckItem from "./CheckItem";
import { setSnapActiveAction } from "./actions";

interface Props {
  slug: string;
  quarter: string;
  section: SectionData;
  responses: Record<string, boolean>;
  trackingMode: TrackingMode;
  snapActive: boolean;
}

export default function Section({ slug, quarter, section, responses, trackingMode, snapActive }: Props) {
  const isSnap = section.channelKey === "snap";
  const disabled = isSnap && !snapActive;

  const subsections = section.subsections
    .map((sub) => {
      const items = sub.items.filter((item) => {
        if (!item.trackingMode) return true;
        if (item.trackingMode === "gtm") return trackingMode === "gtm" || trackingMode === "begge";
        if (item.trackingMode === "shopify") return trackingMode === "shopify" || trackingMode === "begge";
        return true;
      });
      return { ...sub, items };
    })
    .filter((sub) => sub.items.length > 0);

  if (subsections.length === 0 && !isSnap) return null;

  return (
    <section className={`mb-10 ${disabled ? "opacity-60" : ""}`}>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">
          <span className="font-mono text-sm text-neutral-400 mr-3">{section.num}</span>
          {section.title}
        </h2>
        {isSnap && <SnapToggle slug={slug} active={snapActive} />}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        {subsections.map((sub, idx) => (
          <div key={sub.id} className={idx === 0 ? "" : "border-t border-neutral-200"}>
            {sub.label && (
              <div className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500 bg-neutral-50 border-b border-neutral-200">
                {sub.label}
              </div>
            )}
            {sub.items.map((item) => (
              <CheckItem
                key={item.id}
                slug={slug}
                quarter={quarter}
                item={item}
                initialChecked={responses[item.id] ?? false}
                disabled={disabled}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function SnapToggle({ slug, active }: { slug: string; active: boolean }) {
  const [optimistic, setOptimistic] = useState(active);
  function toggle() {
    const next = !optimistic;
    setOptimistic(next);
    void setSnapActiveAction(slug, next);
  }
  return (
    <button
      onClick={toggle}
      className="text-xs text-[#515b12] hover:underline"
    >
      {optimistic ? "Slå av Snap-seksjonen" : "Aktiver Snap-seksjonen"}
    </button>
  );
}
