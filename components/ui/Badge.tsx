import clsx from "clsx";

type BadgeColor = "blue" | "purple" | "orange" | "amber" | "green" | "neutral";

const COLOR_CLASSES: Record<BadgeColor, string> = {
  blue:    "bg-blue-50 text-blue-700",
  purple:  "bg-purple-50 text-purple-700",
  orange:  "bg-orange-50 text-orange-700",
  amber:   "bg-amber-50 text-amber-700",
  green:   "bg-[#dff7cc] text-[#171717] border border-[#41bd0e]/30",
  neutral: "bg-neutral-100 text-neutral-700",
};

interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  className?: string;
}

export default function Badge({ children, color = "neutral", className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md uppercase tracking-wider",
        COLOR_CLASSES[color],
        className
      )}
    >
      {children}
    </span>
  );
}
