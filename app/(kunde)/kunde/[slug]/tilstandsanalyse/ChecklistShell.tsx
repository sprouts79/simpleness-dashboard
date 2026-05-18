"use client";

import { useMemo } from "react";
import { CHECKLIST, getActiveItemIds, type TrackingMode } from "@/lib/checklist-data";
import type { ItemResponse } from "@/lib/db-tilstandsanalyse";
import Section from "./Section";
import TrackingToggle from "./TrackingToggle";

interface Props {
  slug: string;
  quarter: string;
  trackingMode: TrackingMode;
  snapActive: boolean;
  responses: Record<string, ItemResponse>;
}

export default function ChecklistShell({ slug, quarter, trackingMode, snapActive, responses }: Props) {
  const activeIds = useMemo(() => getActiveItemIds(trackingMode, snapActive), [trackingMode, snapActive]);
  const total = activeIds.length;
  const done = activeIds.filter((id) => responses[id]?.state === "ok").length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div>
      <div className="mb-8 space-y-4">
        <div className="flex items-center gap-3">
          <TrackingToggle slug={slug} mode={trackingMode} />
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs font-mono text-neutral-500">{done} / {total} OK</span>
            <span className="text-xs font-mono text-neutral-500">{pct}%</span>
          </div>
          <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#41bd0e] transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {CHECKLIST.map((section) => (
        <Section
          key={section.id}
          slug={slug}
          quarter={quarter}
          section={section}
          responses={responses}
          trackingMode={trackingMode}
          snapActive={snapActive}
        />
      ))}
    </div>
  );
}
