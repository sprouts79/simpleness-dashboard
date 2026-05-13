// Statisk konfigurasjon av leveranser per kunde.
// Fase 2: flyttes til Supabase. Skjemaet her er det vi migrerer til.
//
// Status-konvensjon:
//   godkjent        — kunden har eksplisitt godkjent
//   til_avsjekk     — klar for kundegjennomgang
//   under_utvikling — Simpleness jobber fortsatt (default)
//
// Arve-regel: parent-leveranser arver fra children. Alle godkjent → godkjent,
// ellers → under_utvikling. "Til avsjekk" er reservert for leaf-leveranser.

export type LeveranseStatus = "godkjent" | "til_avsjekk" | "under_utvikling";

export type LeveranseKategori = "performance" | "prosjekter";

export interface Leveranse {
  slug: string;
  navn: string;
  kategori: LeveranseKategori;
  status: LeveranseStatus;
  kort_beskrivelse?: string;
  barn?: Leveranse[];
}

export interface KundeOmrade {
  slug: string;
  navn: string;
  performance: Leveranse[];
  prosjekter: Leveranse[];
}

// ───────────────────────────────────────────────────────────────
// Hjelpefunksjoner
// ───────────────────────────────────────────────────────────────

export function arveStatus(leveranse: Leveranse): LeveranseStatus {
  if (!leveranse.barn || leveranse.barn.length === 0) return leveranse.status;
  const barnStatuser = leveranse.barn.map((b) => arveStatus(b));
  return barnStatuser.every((s) => s === "godkjent") ? "godkjent" : "under_utvikling";
}

export function statusLabel(status: LeveranseStatus): string {
  switch (status) {
    case "godkjent":
      return "Godkjent";
    case "til_avsjekk":
      return "Til avsjekk";
    case "under_utvikling":
      return "Under utvikling";
  }
}

// ───────────────────────────────────────────────────────────────
// Faste leveransetyper (definerer hva som finnes — for grayed-out
// liste når en kunde ikke har leveransen aktiv)
// ───────────────────────────────────────────────────────────────

export const PERFORMANCE_LEVERANSER = [
  { slug: "onboarding", navn: "Onboarding" },
  { slug: "tilstandsanalyse", navn: "Tilstandsanalyse" },
  { slug: "kreativ-brief", navn: "Kreativ Brief" },
  { slug: "budsjett", navn: "Budsjett" },
  { slug: "kampanjeplan", navn: "Kampanjeplan" },
  { slug: "rapportering", navn: "Rapportering" },
] as const;

export const PROSJEKT_LEVERANSER = [
  { slug: "nyhetsbrev", navn: "Nyhetsbrev" },
  { slug: "landingssider", navn: "Landingssider" },
  { slug: "innholdsstrategi", navn: "Innholdsstrategi" },
] as const;

// ───────────────────────────────────────────────────────────────
// Kunde-data
// ───────────────────────────────────────────────────────────────

const KUNDEOMRADER: KundeOmrade[] = [
  {
    slug: "kokkeloren",
    navn: "Kokkeløren",
    performance: [
      {
        slug: "kreativ-brief",
        navn: "Kreativ Brief",
        kategori: "performance",
        status: "til_avsjekk",
        kort_beskrivelse: "Brand, designsystem og kreative retningslinjer",
        barn: [
          {
            slug: "designsystem",
            navn: "Designsystem",
            kategori: "performance",
            status: "til_avsjekk",
            kort_beskrivelse: "v1.0 — legacy bundle-format",
          },
        ],
      },
      {
        slug: "kampanjeplan",
        navn: "Kampanjeplan",
        kategori: "performance",
        status: "under_utvikling",
        kort_beskrivelse: "Mediekjøp, plan og kampanjebriefer",
        barn: [
          {
            slug: "augustkampanje-2026",
            navn: "Augustkampanje 2026",
            kategori: "performance",
            status: "under_utvikling",
            kort_beskrivelse: "Brief klar",
          },
        ],
      },
    ],
    prosjekter: [
      {
        slug: "innholdsstrategi",
        navn: "Innholdsstrategi",
        kategori: "prosjekter",
        status: "godkjent",
        kort_beskrivelse: "17 landingssider — SEO + redaksjonelle",
      },
      {
        slug: "landingssider",
        navn: "Landingssider",
        kategori: "prosjekter",
        status: "under_utvikling",
        kort_beskrivelse: "Design og wireframes for alle sider",
      },
      {
        slug: "nyhetsbrev",
        navn: "Nyhetsbrev",
        kategori: "prosjekter",
        status: "under_utvikling",
        kort_beskrivelse: "Velkomstserie under produksjon",
      },
    ],
  },
  {
    slug: "alfa",
    navn: "Alfa",
    performance: [
      {
        slug: "tilstandsanalyse",
        navn: "Tilstandsanalyse",
        kategori: "performance",
        status: "til_avsjekk",
        kort_beskrivelse: "Q2 2026 — sporing, produktdata, produktfeed",
      },
    ],
    prosjekter: [],
  },
];

// ───────────────────────────────────────────────────────────────
// API
// ───────────────────────────────────────────────────────────────

export function hentKundeomrade(slug: string): KundeOmrade | null {
  return KUNDEOMRADER.find((k) => k.slug === slug) ?? null;
}

export function alleKundeomrader(): KundeOmrade[] {
  return KUNDEOMRADER;
}
