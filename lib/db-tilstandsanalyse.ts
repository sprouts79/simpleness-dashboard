/**
 * Tilstandsanalyse — server-only data layer.
 * Binær checked-state per (client, kvartal, item).
 */

import "server-only";
import { supabase } from "./supabase";
import type { TrackingMode } from "./checklist-data";

export interface TilstandsanalyseConfig {
  client_id: string;
  tracking_mode: TrackingMode;
  snap_active: boolean;
  platform: string;
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
): Promise<Record<string, boolean>> {
  const { data, error } = await supabase
    .from("tilstandsanalyse_responses")
    .select("item_id, checked")
    .eq("client_id", clientId)
    .eq("quarter", quarter);
  if (error) throw new Error(`getResponses: ${error.message}`);
  const out: Record<string, boolean> = {};
  for (const row of data ?? []) out[row.item_id] = row.checked;
  return out;
}

export async function setResponse(
  clientId: string,
  quarter: string,
  itemId: string,
  checked: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("tilstandsanalyse_responses")
    .upsert(
      { client_id: clientId, quarter, item_id: itemId, checked, updated_at: new Date().toISOString() },
      { onConflict: "client_id,quarter,item_id" },
    );
  if (error) throw new Error(`setResponse: ${error.message}`);
}
