/**
 * Newsjacking — server-only data layer.
 */

import "server-only";
import { supabase } from "./supabase";

export type NewsjackingStatus = "foreslatt" | "godkjent" | "avvist";

export interface NewsjackingSource {
  navn: string;
  url: string;
}

export interface NewsjackingDrop {
  id: string;
  kunde_slug: string;
  dato: string;
  ukedag: string;
  tittel: string;
  beskrivelse: string;
  du_vinkling: string;
  sources: NewsjackingSource[];
  status: NewsjackingStatus;
  slack_channel: string | null;
  slack_message_ts: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewsjackingScan {
  id: string;
  kunde_slug: string;
  dato: string;
  ukedag: string;
  saker_scannet: number;
  saker_etter_filter: number;
  ideer_postet: number;
  notater: string | null;
  created_at: string;
}

export async function getDropsByDato(
  kundeSlug: string,
  dato: string,
): Promise<NewsjackingDrop[]> {
  const { data, error } = await supabase
    .from("newsjacking_drops")
    .select("*")
    .eq("kunde_slug", kundeSlug)
    .eq("dato", dato)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`getDropsByDato: ${error.message}`);
  return (data ?? []) as NewsjackingDrop[];
}

export async function getDropsForKunde(
  kundeSlug: string,
): Promise<NewsjackingDrop[]> {
  const { data, error } = await supabase
    .from("newsjacking_drops")
    .select("*")
    .eq("kunde_slug", kundeSlug)
    .order("dato", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw new Error(`getDropsForKunde: ${error.message}`);
  return (data ?? []) as NewsjackingDrop[];
}

export async function getScansForKunde(
  kundeSlug: string,
): Promise<NewsjackingScan[]> {
  const { data, error } = await supabase
    .from("newsjacking_scans")
    .select("*")
    .eq("kunde_slug", kundeSlug)
    .order("dato", { ascending: false });
  if (error) throw new Error(`getScansForKunde: ${error.message}`);
  return (data ?? []) as NewsjackingScan[];
}

export async function setDropStatus(
  dropId: string,
  status: NewsjackingStatus,
): Promise<void> {
  const { error } = await supabase
    .from("newsjacking_drops")
    .update({ status })
    .eq("id", dropId);
  if (error) throw new Error(`setDropStatus: ${error.message}`);
}

export function statusCounts(drops: NewsjackingDrop[]) {
  const counts = { foreslatt: 0, godkjent: 0, avvist: 0 };
  for (const d of drops) counts[d.status]++;
  return counts;
}

export function ukedagFor(dato: string): string {
  const d = new Date(dato + "T12:00:00");
  return ["søn", "man", "tir", "ons", "tor", "fre", "lør"][d.getDay()];
}

export function todayInOslo(): string {
  const now = new Date();
  const oslo = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Oslo" }));
  return oslo.toISOString().slice(0, 10);
}
