/**
 * Simpleness-team — registry mapping simpleness_contact-navn til
 * full kontaktinfo (e-post, profilbilde).
 *
 * Brukes av kunde-flater for å vise hvem som er kundens kontaktperson.
 */

export interface TeamMember {
  name: string;
  email: string;
  photoUrl?: string;
}

export const TEAM: Record<string, TeamMember> = {
  Jonas: {
    name: "Jonas Brusselmans",
    email: "jonas@simpleness.no",
    photoUrl: "/team/jonas.jpg",
  },
  Halvard: {
    name: "Halvard Simonsen",
    email: "halvard@simpleness.no",
    photoUrl: "/team/halvard.jpg",
  },
};

export function teamMember(key: string | null | undefined): TeamMember | null {
  if (!key) return null;
  return TEAM[key] ?? null;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
