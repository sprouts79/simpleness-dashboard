interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex items-baseline justify-between mb-5">
      <div>
        <h2 className="text-2xs font-semibold text-[rgba(9,10,8,0.5)] uppercase tracking-widest">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-[rgba(9,10,8,0.5)] mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
