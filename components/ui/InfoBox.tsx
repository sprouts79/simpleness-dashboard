interface Props {
  children: React.ReactNode;
  title?: string;
}

export default function InfoBox({ children, title }: Props) {
  return (
    <div
      className="max-w-xl border-2 border-[var(--color-black)] px-5 py-4 text-sm bg-[var(--color-accent)] shadow-[3px_3px_0_0_rgba(9,10,8,1)]"
    >
      {title && (
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[rgba(9,10,8,0.4)] mb-3">
          {title}
        </p>
      )}
      {children}
    </div>
  );
}
