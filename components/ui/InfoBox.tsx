interface Props {
  children: React.ReactNode;
  title?: string;
}

/**
 * InfoBox — subtil info/tips-boks. Mint-grønn er reservert for chips og
 * dirty-states andre steder, så vi bruker neutral background her for å unngå
 * visuell tvetydighet (jf. visual-system.md).
 */
export default function InfoBox({ children, title }: Props) {
  return (
    <div className="max-w-xl rounded-xl px-5 py-4 bg-[var(--color-muted)] border border-[var(--color-border)] text-sm leading-relaxed text-[var(--color-fg)]">
      {title && <p className="label mb-2">{title}</p>}
      {children}
    </div>
  );
}
