import clsx from "clsx";

type StatusLevel = "good" | "warning" | "critical" | "idle";

const DOT_CLASSES: Record<StatusLevel, string> = {
  good:     "bg-[#41bd0e]",
  warning:  "bg-amber-400",
  critical: "bg-red-500",
  idle:     "bg-neutral-300",
};

const TEXT_CLASSES: Record<StatusLevel, string> = {
  good:     "text-green-700",
  warning:  "text-amber-700",
  critical: "text-red-600",
  idle:     "text-neutral-500",
};

interface StatusDotProps {
  level: StatusLevel;
  label?: string;
  className?: string;
}

export default function StatusDot({ level, label, className }: StatusDotProps) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 text-xs", TEXT_CLASSES[level], className)}>
      <span className={clsx("w-1.5 h-1.5 rounded-full flex-shrink-0", DOT_CLASSES[level])} />
      {label}
    </span>
  );
}
