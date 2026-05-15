"use client";

import { useTransition } from "react";
import { voteDrop } from "./actions";
import type { NewsjackingStatus } from "@/lib/db-newsjacking";

interface Props {
  dropId: string;
  kundeSlug: string;
  status: NewsjackingStatus;
}

export default function VoteButtons({ dropId, kundeSlug, status }: Props) {
  const [pending, start] = useTransition();
  const disabled = pending || status === "godkjent" || status === "avvist";

  const cast = (vote: "opp" | "ned") => {
    start(() => voteDrop(dropId, kundeSlug, vote));
  };

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => cast("opp")}
        disabled={disabled}
        aria-label="Tommel opp"
        className={`px-3 py-1.5 rounded-md text-base border transition ${
          status === "godkjent"
            ? "border-green-600 bg-green-50 text-green-700"
            : "border-neutral-200 bg-white text-neutral-600 hover:border-green-600 hover:text-green-700 disabled:opacity-50"
        }`}
      >
        👍
      </button>
      <button
        type="button"
        onClick={() => cast("ned")}
        disabled={disabled}
        aria-label="Tommel ned"
        className={`px-3 py-1.5 rounded-md text-base border transition ${
          status === "avvist"
            ? "border-red-600 bg-red-50 text-red-700"
            : "border-neutral-200 bg-white text-neutral-600 hover:border-red-600 hover:text-red-700 disabled:opacity-50"
        }`}
      >
        👎
      </button>
    </div>
  );
}
