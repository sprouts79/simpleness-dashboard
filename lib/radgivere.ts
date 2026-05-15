/**
 * Simpleness-rådgivere — listen brukes som dropdown/chip-valg når en rådgiver
 * skal allokeres til en kunde. Lagres som fullt navn i clients.simpleness_contact.
 */

export interface Radgiver {
  navn: string;
  email: string;
}

export const RADGIVERE: readonly Radgiver[] = [
  { navn: "Jonas Brusselmans", email: "jonas@simpleness.no" },
  { navn: "Thale Espenes", email: "thale@simpleness.no" },
  { navn: "Halvard Simonsen", email: "halvard@simpleness.no" },
  { navn: "Vidar Ravneng", email: "vidar@simpleness.no" },
  { navn: "Silje", email: "silje@simpleness.no" },
  { navn: "Kim Gerhardsen", email: "kim@simpleness.no" },
] as const;

export const RADGIVER_NAVN = RADGIVERE.map((r) => r.navn);

export function radgiverByNavn(navn: string | null): Radgiver | null {
  if (!navn) return null;
  return RADGIVERE.find((r) => r.navn === navn) ?? null;
}
