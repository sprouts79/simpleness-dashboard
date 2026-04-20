interface Props {
  children: React.ReactNode;
  title?: string;
}

export default function InfoBox({ children, title }: Props) {
  return (
    <div className="max-w-xl rounded-lg border border-[var(--color-border)] px-5 py-4 text-sm bg-[var(--color-gray-50)]">
      {title && (
        <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-gray-400)] mb-3">
          {title}
        </p>
      )}
      {children}
    </div>
  );
}
