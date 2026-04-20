interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex items-baseline justify-between mb-5">
      <div>
        <h2 className="text-sm font-semibold text-[var(--color-black)] tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-[var(--color-gray-400)] mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
