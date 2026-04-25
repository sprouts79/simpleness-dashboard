interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

/**
 * Section header — eyebrow-stil tittel over en innholdsblokk.
 * Bevisst dempet. Lar tallene/innholdet være visuell hovedperson.
 */
export default function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex items-baseline justify-between gap-4 mb-5">
      <div className="min-w-0">
        <p className="label">{title}</p>
        {subtitle && (
          <p className="text-sm text-[var(--color-fg-muted)] mt-1.5 leading-snug">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
