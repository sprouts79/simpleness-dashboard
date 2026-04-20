interface Props {
  children: React.ReactNode;
  title?: string;
}

export default function InfoBox({ children, title }: Props) {
  return (
    <div
      className="max-w-xl rounded-xl px-5 py-5 text-base leading-relaxed"
      style={{
        background: "rgba(137, 255, 88, 0.08)",
        border: "1px solid rgba(137, 255, 88, 0.25)",
        color: "var(--color-black)",
      }}
    >
      {title && (
        <p className="text-2xs font-semibold uppercase tracking-widest text-[rgba(9,10,8,0.5)] mb-3">
          {title}
        </p>
      )}
      {children}
    </div>
  );
}
