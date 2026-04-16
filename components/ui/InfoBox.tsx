interface Props {
  children: React.ReactNode;
}

/**
 * "Hvordan lese denne rapporten"-boks.
 * Grønn bakgrunn fra Simpleness designsystem (--color-accent @ lav opacity).
 */
export default function InfoBox({ children }: Props) {
  return (
    <div
      className="rounded-xl px-5 py-4 text-sm leading-relaxed"
      style={{
        background: "rgba(137, 255, 88, 0.10)",
        border: "1px solid rgba(137, 255, 88, 0.30)",
        color: "var(--color-black)",
      }}
    >
      {children}
    </div>
  );
}
