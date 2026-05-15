/**
 * Simpleness-team — slår opp full kontaktinfo (e-post, profilbilde) basert på
 * verdien i clients.simpleness_contact (fullt navn).
 *
 * Rådgiver-listen lever i lib/radgivere.ts. team.ts legger på profilbilder.
 */

import { radgiverByNavn } from "./radgivere";

export interface TeamMember {
  name: string;
  email: string;
  photoUrl?: string;
}

// Filnavn må eksistere under public/team/ for at bildet skal vises.
// Fallback er initialer hvis ingen mapping eller hvis filen mangler.
const PHOTO_BY_NAVN: Record<string, string> = {
  "Halvard Simonsen": "/team/halvard.jpg",
  "Jonas Brusselmans": "/team/jonas.jpg",
};

export function teamMember(key: string | null | undefined): TeamMember | null {
  const r = radgiverByNavn(key ?? null);
  if (!r) return null;
  return {
    name: r.navn,
    email: r.email,
    photoUrl: PHOTO_BY_NAVN[r.navn],
  };
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
