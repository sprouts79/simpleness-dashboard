interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

/**
 * Section header — Shopify-stil normal case + subtle underline.
 * Ligger på lys grå app-bg, mellom kort.
 */
export default function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex items-baseline justify-between gap-4 mb-4">
      <div className="min-w-0">
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="text-sm text-neutral-600 mt-1 leading-snug">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
