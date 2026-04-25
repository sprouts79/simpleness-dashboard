interface PulseIconProps {
  className?: string;
  strokeWidth?: number;
}

/**
 * Pulse-ikon — lightning bolt. Stroke-stil matcher Guide- og Dokumentasjon-
 * ikonene i sidebaren. Bruker currentColor — kan tones med text-color
 * på forelder (eks. neon-grønn i brand-footer).
 */
export default function PulseIcon({ className = "", strokeWidth = 1.5 }: PulseIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}
