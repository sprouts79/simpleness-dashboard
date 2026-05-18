/**
 * Klient-trygge typer + konstanter for Kunder-modulen.
 * Importeres av både server-kode (lib/db-kunder.ts) og klient-komponenter.
 *
 * Hold dette fri for Node-spesifikke importer (supabase, fs).
 */

export type LifecycleStage =
  | "onboarding_ikke_startet"
  | "onboarding_steg_1"
  | "onboarding_steg_2"
  | "onboarding_steg_3"
  | "onboarding_fullfort"
  | "aktiv"
  | "arkivert";

export type LeveranseStatus = "godkjent" | "til_avsjekk" | "under_utvikling";
export type LeveranseKategori = "performance" | "prosjekter";

export interface Kunde {
  id: string;
  name: string;
  slug: string;
  meta_account_id: string | null;
  contact_name: string | null;
  contact_email: string | null;
  simpleness_contact: string | null;
  slack_invite_url: string | null;
  lifecycle_stage: LifecycleStage;
  archived_at: string | null;
  created_at: string;
}

export interface ClientLeveranse {
  id: number;
  client_id: string;
  slug: string;
  navn: string;
  kategori: LeveranseKategori;
  status: LeveranseStatus;
  aktiv: boolean;
  kort_beskrivelse: string | null;
  parent_id: number | null;
}

// ────────────────────────────────────────────────────────────
// Faste leveransetyper
// ────────────────────────────────────────────────────────────

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

// ────────────────────────────────────────────────────────────
// Hjelpere
// ────────────────────────────────────────────────────────────

export function lifecycleStageLabel(stage: LifecycleStage): string {
  switch (stage) {
    case "onboarding_ikke_startet": return "Onboarding · Ikke startet";
    case "onboarding_steg_1":       return "Onboarding · Steg 1";
    case "onboarding_steg_2":       return "Onboarding · Steg 2";
    case "onboarding_steg_3":       return "Onboarding · Steg 3";
    case "onboarding_fullfort":     return "Onboarding fullført";
    case "aktiv":                   return "Aktiv";
    case "arkivert":                return "Arkivert";
  }
}

export function lifecycleStagePillClass(stage: LifecycleStage): "done" | "review" | "idle" | "archived" {
  if (stage === "aktiv") return "done";
  if (stage === "arkivert") return "archived";
  if (stage === "onboarding_ikke_startet") return "idle";
  return "review";
}

export function statusLabel(status: LeveranseStatus): string {
  switch (status) {
    case "godkjent":        return "Godkjent";
    case "til_avsjekk":     return "Til avsjekk";
    case "under_utvikling": return "Under utvikling";
  }
}

/**
 * Per-leveranse-overstyring av statuslabel. Onboarding skal vises som
 * 'Fullført' når den er godkjent — det er kundens språk for at de er ferdige.
 */
export function statusLabelFor(slug: string, status: LeveranseStatus): string {
  if (slug === "onboarding" && status === "godkjent") return "Fullført";
  return statusLabel(status);
}

export function arveStatus(leveranse: ClientLeveranse, alle: ClientLeveranse[]): LeveranseStatus {
  const barn = alle.filter((l) => l.parent_id === leveranse.id);
  if (barn.length === 0) return leveranse.status;
  return barn.every((b) => arveStatus(b, alle) === "godkjent") ? "godkjent" : "under_utvikling";
}

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}
