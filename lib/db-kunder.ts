/**
 * Kunder-modul — server-only data layer.
 * Klient-trygge typer + konstanter ligger i lib/types-kunder.ts.
 */

import "server-only";
import { supabase } from "./supabase";
import {
  PERFORMANCE_LEVERANSER,
  PROSJEKT_LEVERANSER,
  type Kunde,
  type ClientLeveranse,
  type LifecycleStage,
  type LeveranseStatus,
} from "./types-kunder";

// Re-export så server-kode kan importere alt fra ett sted
export * from "./types-kunder";

// ────────────────────────────────────────────────────────────
// Queries
// ────────────────────────────────────────────────────────────

export async function getKunder(): Promise<Kunde[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, slug, meta_account_id, contact_name, contact_email, simpleness_contact, slack_invite_url, lifecycle_stage, archived_at, created_at")
    .order("name", { ascending: true });

  if (error) throw new Error(`getKunder: ${error.message}`);
  return (data ?? []) as Kunde[];
}

export async function getKunde(slug: string): Promise<Kunde | null> {
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, slug, meta_account_id, contact_name, contact_email, simpleness_contact, slack_invite_url, lifecycle_stage, archived_at, created_at")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`getKunde: ${error.message}`);
  return data as Kunde | null;
}

export interface KundeOmradeDB {
  slug: string;
  navn: string;
  performance: ClientLeveranse[];
  prosjekter: ClientLeveranse[];
}

export async function hentKundeomradeDB(slug: string): Promise<KundeOmradeDB | null> {
  const kunde = await getKunde(slug);
  if (!kunde) return null;
  const lev = await getClientLeveranser(kunde.id);
  // Kun top-level leveranser i hovedlisten. Barn (parent_id != null) vises på detalj-sider.
  const top = lev.filter((l) => l.parent_id === null && l.aktiv);
  return {
    slug: kunde.slug,
    navn: kunde.name,
    performance: top.filter((l) => l.kategori === "performance"),
    prosjekter: top.filter((l) => l.kategori === "prosjekter"),
  };
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
  slackInviteUrl?: string | null;
  metaAccountId?: string | null;
  performanceSlugs: string[];
  prosjektSlugs: string[];
}

export async function createKunde(input: CreateKundeInput): Promise<{ kunde: Kunde }> {
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      id: input.slug,
      slug: input.slug,
      name: input.name,
      meta_account_id: input.metaAccountId || null,
      contact_name: input.contactName?.trim() || null,
      contact_email: input.contactEmail?.trim() || null,
      simpleness_contact: input.simplenessContact,
      slack_invite_url: input.slackInviteUrl?.trim() || null,
      lifecycle_stage: "onboarding_ikke_startet",
      status: "green",
    })
    .select("id, name, slug, meta_account_id, contact_name, contact_email, simpleness_contact, slack_invite_url, lifecycle_stage, archived_at, created_at")
    .single();

  if (clientError) throw new Error(`createKunde: ${clientError.message}`);

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

export async function updateKundeRadgiver(slug: string, navn: string): Promise<void> {
  const { error } = await supabase
    .from("clients")
    .update({ simpleness_contact: navn })
    .eq("slug", slug);
  if (error) throw new Error(`updateKundeRadgiver: ${error.message}`);
}

export async function updateKundeSlackInvite(slug: string, url: string | null): Promise<void> {
  const { error } = await supabase
    .from("clients")
    .update({ slack_invite_url: url?.trim() || null })
    .eq("slug", slug);
  if (error) throw new Error(`updateKundeSlackInvite: ${error.message}`);
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

export async function aktiverLeveranse(
  clientId: string,
  slug: string,
  navn: string,
  kategori: "performance" | "prosjekter",
): Promise<void> {
  const { data: existing, error: selErr } = await supabase
    .from("client_leveranser")
    .select("id")
    .eq("client_id", clientId)
    .eq("slug", slug)
    .maybeSingle();
  if (selErr) throw new Error(`aktiverLeveranse select: ${selErr.message}`);

  if (existing) {
    const { error } = await supabase
      .from("client_leveranser")
      .update({ aktiv: true })
      .eq("id", existing.id);
    if (error) throw new Error(`aktiverLeveranse update: ${error.message}`);
  } else {
    const { error } = await supabase
      .from("client_leveranser")
      .insert({ client_id: clientId, slug, navn, kategori, aktiv: true, status: "under_utvikling" });
    if (error) throw new Error(`aktiverLeveranse insert: ${error.message}`);
  }
}
