/**
 * Tilstandsanalyse — server-only data layer.
 * Klient-trygge typer + sjekkpunkt-katalog ligger i lib/types-tilstandsanalyse.ts.
 */

import "server-only";
import { supabase } from "./supabase";
import {
  type AuditState,
  type AuditItemRow,
  type AuditItemState,
  type AuditVersjon,
  kvartalFor,
} from "./types-tilstandsanalyse";

export * from "./types-tilstandsanalyse";

// ────────────────────────────────────────────────────────────
// Queries
// ────────────────────────────────────────────────────────────

export async function getStates(clientId: string): Promise<AuditState[]> {
  const { data, error } = await supabase
    .from("audit_states")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`getStates: ${error.message}`);
  return (data ?? []) as AuditState[];
}

/** Hent gjeldende draft (om finnes) for kunden. */
export async function getDraft(clientId: string): Promise<AuditState | null> {
  const { data, error } = await supabase
    .from("audit_states")
    .select("*")
    .eq("client_id", clientId)
    .in("versjon", ["draft", "under_review"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`getDraft: ${error.message}`);
  return data as AuditState | null;
}

/** Hent gjeldende godkjente versjon for kunden (det kunden ser). */
export async function getGodkjent(clientId: string): Promise<AuditState | null> {
  const { data, error } = await supabase
    .from("audit_states")
    .select("*")
    .eq("client_id", clientId)
    .eq("versjon", "godkjent")
    .maybeSingle();
  if (error) throw new Error(`getGodkjent: ${error.message}`);
  return data as AuditState | null;
}

export async function getItems(stateId: string): Promise<AuditItemRow[]> {
  const { data, error } = await supabase
    .from("audit_items")
    .select("*")
    .eq("state_id", stateId);
  if (error) throw new Error(`getItems: ${error.message}`);
  return (data ?? []) as AuditItemRow[];
}

// ────────────────────────────────────────────────────────────
// Mutations
// ────────────────────────────────────────────────────────────

/** Opprett ny draft for kunden. Sletter eventuell eksisterende draft. */
export async function startDraft(clientId: string): Promise<{ stateId: string }> {
  // Slett eksisterende draft + items (cascade)
  await supabase.from("audit_states")
    .delete()
    .eq("client_id", clientId)
    .in("versjon", ["draft", "under_review"]);

  const { data, error } = await supabase
    .from("audit_states")
    .insert({
      client_id: clientId,
      versjon: "draft" as AuditVersjon,
      kvartal: kvartalFor(),
    })
    .select("id")
    .single();
  if (error) throw new Error(`startDraft: ${error.message}`);

  return { stateId: data.id };
}

/** Sett status + note + assignee for ett sjekkpunkt. Oppretter raden hvis den ikke finnes. */
export async function upsertItem(
  stateId: string,
  itemId: string,
  patch: { state?: AuditItemState; note?: string | null; assignee?: "kunde" | null },
): Promise<void> {
  const { error } = await supabase
    .from("audit_items")
    .upsert(
      {
        state_id: stateId,
        item_id: itemId,
        state: patch.state,
        note: patch.note,
        assignee: patch.assignee,
        auto: false,
      },
      { onConflict: "state_id,item_id" }
    );
  if (error) throw new Error(`upsertItem: ${error.message}`);

  // Sørg for at state markeres som "under_review" så snart konsulent har rørt noe
  await supabase
    .from("audit_states")
    .update({ versjon: "under_review" as AuditVersjon })
    .eq("id", stateId)
    .eq("versjon", "draft");
}

/**
 * Godkjenn versjonen — flytter eksisterende godkjent til arkivert,
 * og setter denne til godkjent.
 */
export async function approveVersjon(stateId: string, godkjentAv: string): Promise<void> {
  // Finn kunde-id for denne staten
  const { data: state, error: stateErr } = await supabase
    .from("audit_states")
    .select("client_id")
    .eq("id", stateId)
    .single();
  if (stateErr || !state) throw new Error(`approveVersjon: state not found`);

  // Arkiver eksisterende godkjent (hvis finnes)
  await supabase
    .from("audit_states")
    .update({ versjon: "arkivert" as AuditVersjon })
    .eq("client_id", state.client_id)
    .eq("versjon", "godkjent");

  // Promoter denne staten
  const { error } = await supabase
    .from("audit_states")
    .update({
      versjon: "godkjent" as AuditVersjon,
      godkjent_av: godkjentAv,
      godkjent_dato: new Date().toISOString(),
    })
    .eq("id", stateId);
  if (error) throw new Error(`approveVersjon: ${error.message}`);
}

/** Tilbakestill godkjent versjon til draft for redigering (admin). */
export async function reopenForEdit(stateId: string): Promise<void> {
  const { error } = await supabase
    .from("audit_states")
    .update({ versjon: "draft" as AuditVersjon, godkjent_av: null, godkjent_dato: null })
    .eq("id", stateId);
  if (error) throw new Error(`reopenForEdit: ${error.message}`);
}

// ────────────────────────────────────────────────────────────
// Aggregert hjelpe-objekt for visning
// ────────────────────────────────────────────────────────────

export interface AuditSnapshot {
  state: AuditState;
  itemsById: Record<string, AuditItemRow>;
}

export async function getAuditSnapshot(stateId: string): Promise<AuditSnapshot | null> {
  const { data: state, error } = await supabase
    .from("audit_states")
    .select("*")
    .eq("id", stateId)
    .maybeSingle();
  if (error) throw new Error(`getAuditSnapshot: ${error.message}`);
  if (!state) return null;

  const items = await getItems(stateId);
  const itemsById = Object.fromEntries(items.map((i) => [i.item_id, i]));
  return { state: state as AuditState, itemsById };
}
