import type { LeveranseStatus } from "@/lib/clients-leveranser";
import { statusLabel } from "@/lib/clients-leveranser";

interface StatusPillProps {
  status: LeveranseStatus;
  disabled?: boolean;
}

const STYLES: Record<LeveranseStatus, { bg: string; dot: string; text: string }> = {
  godkjent: {
    bg: "bg-green-50",
    dot: "bg-green-500",
    text: "text-green-900",
  },
  til_avsjekk: {
    bg: "bg-yellow-50",
    dot: "bg-yellow-500",
    text: "text-yellow-900",
  },
  under_utvikling: {
    bg: "bg-neutral-100",
    dot: "bg-neutral-400",
    text: "text-neutral-700",
  },
};

export default function StatusPill({ status, disabled = false }: StatusPillProps) {
  const style = STYLES[status];
  const opacity = disabled ? "opacity-40" : "";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.bg} ${style.text} ${opacity}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {statusLabel(status)}
    </span>
  );
}
