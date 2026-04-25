interface PulseIconProps {
  className?: string;
}

/**
 * Pulse-indikator — neon-grønn dot. Matcher Shopify's "live counter"-stil
 * (eks. "● 28 live visitors"). Brukes som signatur for Puls-knappen og
 * brand-marken.
 */
export default function PulseIcon({ className = "" }: PulseIconProps) {
  return (
    <span
      className={`inline-block rounded-full bg-[#89FF58] flex-shrink-0 ${className}`}
    />
  );
}
