"use client";

import { useTransition } from "react";
import { aktiverLeveranseAction } from "./actions";

interface Props {
  kundeSlug: string;
  leveranseSlug: string;
  leveranseNavn: string;
  kategori: "performance" | "prosjekter";
}

export default function AktiverLeveranseButton({ kundeSlug, leveranseSlug, leveranseNavn, kategori }: Props) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const res = await aktiverLeveranseAction(kundeSlug, leveranseSlug, leveranseNavn, kategori);
      if (!res.ok) alert(`Kunne ikke aktivere: ${res.error}`);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="text-xs font-medium text-[#515b12] hover:underline disabled:opacity-40"
    >
      {pending ? "Aktiverer …" : "Aktiver"}
    </button>
  );
}
