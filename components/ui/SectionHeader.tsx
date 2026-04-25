interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex items-baseline justify-between gap-4 mb-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{title}</p>
        {subtitle && <p className="text-sm text-neutral-600 mt-1 leading-snug">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
