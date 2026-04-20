interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  useFieldset?: boolean;
}

export default function SectionHeader({ title, subtitle, action, useFieldset = false }: SectionHeaderProps) {
  if (useFieldset) {
    return (
      <div className="mb-6">
        <div className="fieldset-header">
          <span>{title}</span>
        </div>
        {subtitle && (
          <p className="text-center text-sm text-gray-500 mt-2">{subtitle}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-navy tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
