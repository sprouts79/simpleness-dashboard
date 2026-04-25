interface Props {
  children: React.ReactNode;
  title?: string;
}

export default function InfoBox({ children, title }: Props) {
  return (
    <div className="max-w-xl rounded-xl px-4 py-3.5 bg-neutral-50 border border-neutral-200 text-sm leading-relaxed text-neutral-900">
      {title && (
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">
          {title}
        </p>
      )}
      {children}
    </div>
  );
}
