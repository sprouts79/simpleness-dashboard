"use client";

import { useState, useTransition } from "react";
import { RADGIVER_NAVN } from "@/lib/radgivere";
import { saveRadgiverAction } from "./actions";

interface Props {
  slug: string;
  initial: string | null;
}

export default function RadgiverEditor({ slug, initial }: Props) {
  const [valgt, setValgt] = useState<string | null>(initial);
  const [pending, start] = useTransition();
  const [feil, setFeil] = useState<string | null>(null);

  const lagre = (navn: string) => {
    setValgt(navn);
    setFeil(null);
    start(async () => {
      const res = await saveRadgiverAction(slug, navn);
      if (!res.ok) setFeil(res.error ?? "Kunne ikke lagre");
    });
  };

  return (
    <div className="px-5 py-3">
      <div className="text-xs text-neutral-500 mb-2">Rådgiver</div>
      <div className="flex flex-wrap gap-2">
        {RADGIVER_NAVN.map((navn) => {
          const active = valgt === navn;
          return (
            <button
              key={navn}
              type="button"
              onClick={() => lagre(navn)}
              disabled={pending}
              className={`px-3 py-1.5 rounded-full text-sm border transition ${
                active
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
              } ${pending ? "opacity-50" : ""}`}
            >
              {navn}
            </button>
          );
        })}
      </div>
      {feil && <div className="mt-2 text-xs text-red-700">{feil}</div>}
    </div>
  );
}
