/**
 * Kunder-modul — data layer.
 * Erstatter den statiske `lib/clients-leveranser.ts`-arrayen for kunder + leveranser.
 * Server-only.
 */

import { supabase } from "./supabase";

// ────────────────────────────────────────────────────────────
// Typer
// ────────────────────────────────────────────────────────────

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
  id: string;                       // = slug
  name: string;
  slug: string;
  meta_account_id: string | null;
  contact_name: string | null;
  contact_email: string | null;
  simpleness_contact: string | null;
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
// Faste leveransetyper (matcher original lib/clients-leveranser.ts)
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
  return "review"; // _steg_1, _steg_2, _steg_3, _fullfort
}

export function statusLabel(status: LeveranseStatus): string {
  switch (status) {
    case "godkjent":        return "Godkjent";
    case "til_avsjekk":     return "Til avsjekk";
    case "under_utvikling": return "Under utvikling";
  }
}

/**
 * Arve-regel: parent-leveranser arver fra children.
 * Alle godkjent → godkjent, ellers → under_utvikling.
 */
export function arveStatus(leveranse: ClientLeveranse, alle: ClientLeveranse[]): LeveranseStatus {
  const barn = alle.filter((l) => l.parent_id === leveranse.id);
  if (barn.length === 0) return leveranse.status;
  return barn.every((b) => arveStatus(b, alle) === "godkjent") ? "godkjent" : "under_utvikling";
}

// ────────────────────────────────────────────────────────────
// Queries
// ────────────────────────────────────────────────────────────

export async function getKunder(): Promise<Kunde[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, slug, meta_account_id, contact_name, contact_email, simpleness_contact, lifecycle_stage, archived_at, created_at")
    .order("name", { ascending: true });

  if (error) throw new Error(`getKunder: ${error.message}`);
  return (data ?? []) as Kunde[];
}

export async function getKunde(slug: string): Promise<Kunde | null> {
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, slug, meta_account_id, contact_name, contact_email, simpleness_contact, lifecycle_stage, archived_at, created_at")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`getKunde: ${error.message}`);
  return data as Kunde | null;
}

export async function getClientLeveranser(clientId: string): Promise<ClientLeveranse[]> {
  const { data, error } = await supabase
    .from("client_leveranser")
    .select("id, client_id, slug, navn, kategori, status, aktiv, kort_beskrivelse, parent_id")
    .eq("client_id", clientId)
    .order("kategori", { ascending: true })
    .order("id", { ascending: true });

  if (error) throw new Error(`getClientLeveranser: ${error.message}`);
  return (data ?? []) as ClientLeveranse[];
}

// ────────────────────────────────────────────────────────────
// Mutations
// ────────────────────────────────────────────────────────────

export interface CreateKundeInput {
  name: string;
  slug: string;
  contactName: string;
  contactEmail: string;
  simplenessContact: string;
  metaAccountId?: string | null;
  performanceSlugs: string[];      // hvilke Performance-leveranser som skal aktiveres
  prosjektSlugs: string[];         // hvilke Prosjekter
}

export async function createKunde(input: CreateKundeInput): Promise<{ kunde: Kunde }> {
  // 1. Insert client
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      id: input.slug,
      slug: input.slug,
      name: input.name,
      meta_account_id: input.metaAccountId || null,
      contact_name: input.contactName,
      contact_email: input.contactEmail,
      simpleness_contact: input.simplenessContact,
      lifecycle_stage: "onboarding_ikke_startet",
      status: "green",
    })
    .select("id, name, slug, meta_account_id, contact_name, contact_email, simpleness_contact, lifecycle_stage, archived_at, created_at")
    .single();

  if (clientError) throw new Error(`createKunde: ${clientError.message}`);

  // 2. Insert active leveranser
  const leveranserToInsert = [
    ...input.performanceSlugs.map((slug) => {
      const def = PERFORMANCE_LEVERANSER.find((p) => p.slug === slug);
      return def ? { client_id: input.slug, slug: def.slug, navn: def.navn, kategori: "performance" as const, aktiv: true, status: "under_utvikling" as const } : null;
    }),
    ...input.prosjektSlugs.map((slug) => {
      const def = PROSJEKT_LEVERANSER.find((p) => p.slug === slug);
      return def ? { client_id: input.slug, slug: def.slug, navn: def.navn, kategori: "prosjekter" as const, aktiv: true, status: "under_utvikling" as const } : null;
    }),
  ].filter((x): x is NonNullable<typeof x> => x !== null);

  if (leveranserToInsert.length > 0) {
    const { error: levError } = await supabase.from("client_leveranser").insert(leveranserToInsert);
    if (levError) throw new Error(`createKunde leveranser: ${levError.message}`);
  }

  return { kunde: client as Kunde };
}

export async function updateKundeLifecycle(slug: string, stage: LifecycleStage): Promise<void> {
  const { error } = await supabase
    .from("clients")
    .update({ lifecycle_stage: stage })
    .eq("slug", slug);
  if (error) throw new Error(`updateKundeLifecycle: ${error.message}`);
}

export async function updateLeveranseStatus(id: number, status: LeveranseStatus): Promise<void> {
  const { error } = await supabase
    .from("client_leveranser")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(`updateLeveranseStatus: ${error.message}`);
}

// ────────────────────────────────────────────────────────────
// Slug-utility
// ────────────────────────────────────────────────────────────

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}
