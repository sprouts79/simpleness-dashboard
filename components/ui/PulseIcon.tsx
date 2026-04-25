interface PulseIconProps {
  className?: string;
  /** Skru av neon og bruk currentColor i stedet. */
  monochrome?: boolean;
  strokeWidth?: number;
}

/**
 * Puls-ikon — pulsbølge-linje. Default neon-grønn stroke (#89FF58),
 * passer best på mørk bakgrunn. Bruk monochrome=true for å arve currentColor.
 */
export default function PulseIcon({
  className = "",
  monochrome = false,
  strokeWidth = 2,
}: PulseIconProps) {
  const stroke = monochrome ? "currentColor" : "#89FF58";
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M3 12h3l3-9 4 18 3-9h5" />
    </svg>
  );
}
