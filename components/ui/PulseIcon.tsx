interface PulseIconProps {
  className?: string;
  /** Skru av neon-aksent (rendrer alt i currentColor). Default: aksent på. */
  monochrome?: boolean;
}

/**
 * Puls-ikon — Simpleness-signatur. Seks vertikale capsules i pulsbølge-form
 * med neon-grønn aksent (#89FF58) på den nest største. Bruker currentColor
 * for resten — fungerer både på lys og mørk bakgrunn.
 */
export default function PulseIcon({ className = "", monochrome = false }: PulseIconProps) {
  const accent = monochrome ? "currentColor" : "#89FF58";
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="2.5" cy="12" rx="1" ry="3" />
      <ellipse cx="6.5" cy="12" rx="1.4" ry="6" />
      <ellipse cx="11" cy="12" rx="1.6" ry="9" />
      <ellipse cx="15.5" cy="12" rx="1.6" ry="9" fill={accent} />
      <ellipse cx="19.5" cy="12" rx="1.4" ry="5" />
      <ellipse cx="22.5" cy="12" rx="1" ry="2.5" />
    </svg>
  );
}
