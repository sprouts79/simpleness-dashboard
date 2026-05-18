/**
 * Tilstandsanalyse — server-only data layer.
 * Statussystem per (client, kvartal, item): null|na|p1|p2|wip|ok + notat + assignee.
 */

import "server-only";
import { supabase } from "./supabase";
import type { TrackingMode } from "./checklist-data";

export type ItemState = "feil" | "mangler" | "na" | "wip" | "ok";
export type Assignee = "kunde";

export interface TilstandsanalyseConfig {
  client_id: string;
  tracking_mode: TrackingMode;
  snap_active: boolean;
  platform: string;
}

export interface ItemResponse {
  state: ItemState | null;
  note: string | null;
  assignee: Assignee | null;
}

export async function getConfig(clientId: string): Promise<TilstandsanalyseConfig> {
  const { data, error } = await supabase
    .from("tilstandsanalyse_config")
    .select("client_id, tracking_mode, snap_active, platform")
    .eq("client_id", clientId)
    .maybeSingle();
  if (error) throw new Error(`getConfig: ${error.message}`);
  return (
    (data as TilstandsanalyseConfig | null) ?? {
      client_id: clientId,
      tracking_mode: "shopify",
      snap_active: false,
      platform: "shopify",
    }
  );
}

export async function upsertConfig(
  clientId: string,
  patch: Partial<Omit<TilstandsanalyseConfig, "client_id">>,
): Promise<void> {
  const { data: existing } = await supabase
    .from("tilstandsanalyse_config")
    .select("client_id")
    .eq("client_id", clientId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("tilstandsanalyse_config")
      .update(patch)
      .eq("client_id", clientId);
    if (error) throw new Error(`upsertConfig update: ${error.message}`);
  } else {
    const { error } = await supabase
      .from("tilstandsanalyse_config")
      .insert({ client_id: clientId, ...patch });
    if (error) throw new Error(`upsertConfig insert: ${error.message}`);
  }
}

export async function getResponses(
  clientId: string,
  quarter: string,
): Promise<Record<string, ItemResponse>> {
  const { data, error } = await supabase
    .from("tilstandsanalyse_responses")
    .select("item_id, state, note, assignee")
    .eq("client_id", clientId)
    .eq("quarter", quarter);
  if (error) throw new Error(`getResponses: ${error.message}`);
  const out: Record<string, ItemResponse> = {};
  for (const row of (data ?? []) as Array<{ item_id: string; state: ItemState | null; note: string | null; assignee: Assignee | null }>) {
    out[row.item_id] = { state: row.state, note: row.note, assignee: row.assignee };
  }
  return out;
}

export async function upsertResponse(
  clientId: string,
  quarter: string,
  itemId: string,
  patch: Partial<ItemResponse>,
): Promise<void> {
  const { data: existing } = await supabase
    .from("tilstandsanalyse_responses")
    .select("id")
    .eq("client_id", clientId)
    .eq("quarter", quarter)
    .eq("item_id", itemId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("tilstandsanalyse_responses")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) throw new Error(`upsertResponse update: ${error.message}`);
  } else {
    const { error } = await supabase
      .from("tilstandsanalyse_responses")
      .insert({
        client_id: clientId,
        quarter,
        item_id: itemId,
        state: patch.state ?? null,
        note: patch.note ?? null,
        assignee: patch.assignee ?? null,
      });
    if (error) throw new Error(`upsertResponse insert: ${error.message}`);
  }
}
