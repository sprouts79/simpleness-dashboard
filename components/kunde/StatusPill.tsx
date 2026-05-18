import type { LeveranseStatus } from "@/lib/types-kunder";
import { statusLabel, statusLabelFor } from "@/lib/types-kunder";

interface StatusPillProps {
  status: LeveranseStatus;
  slug?: string;
  disabled?: boolean;
}

const STYLES: Record<LeveranseStatus, string> = {
  godkjent: "bg-green-50 text-green-700 border-green-200",
  til_avsjekk: "bg-yellow-50 text-yellow-900 border-yellow-200",
  under_utvikling: "bg-neutral-50 text-neutral-500 border-neutral-200",
};

export default function StatusPill({ status, slug, disabled }: StatusPillProps) {
  const label = slug ? statusLabelFor(slug, status) : statusLabel(status);
  const style = disabled
    ? "bg-neutral-50 text-neutral-300 border-neutral-200"
    : STYLES[status];
  return (
    <span
      className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full whitespace-nowrap border ${style}`}
    >
      {disabled ? "Ikke aktivert" : label}
    </span>
  );
}
