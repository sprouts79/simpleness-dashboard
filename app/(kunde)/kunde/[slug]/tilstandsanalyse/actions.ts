"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { getGodkjent } from "@/lib/db-tilstandsanalyse";

/**
 * Kunde markerer at en "Hos dere"-oppgave er fullført.
 * Setter status til 'avsjekk' — venter på verifisering fra Simpleness.
 *
 * Sikkerhet: tar `slug` fra URL, oppdaterer kun items som tilhører den
 * godkjente versjonen for den kunden, og kun items hvor assignee='kunde'.
 */
export async function markFullfortAction(slug: string, itemId: string) {
  const godkjent = await getGodkjent(slug);
  if (!godkjent) throw new Error("Ingen godkjent versjon");

  const { data: existing, error: readErr } = await supabase
    .from("audit_items")
    .select("id, assignee, state")
    .eq("state_id", godkjent.id)
    .eq("item_id", itemId)
    .maybeSingle();
  if (readErr) throw new Error(`markFullfortAction read: ${readErr.message}`);
  if (!existing) throw new Error("Sjekkpunkt ikke funnet");

  // Kunden får kun markere fullført på egne oppgaver
  if (existing.assignee !== "kunde") {
    throw new Error("Dette punktet kan ikke markeres fra kunde-siden");
  }

  // Ingen poeng i å markere noe som allerede er OK
  if (existing.state === "ok") return;

  const { error } = await supabase
    .from("audit_items")
    .update({ state: "avsjekk" })
    .eq("id", existing.id);
  if (error) throw new Error(`markFullfortAction: ${error.message}`);

  revalidatePath(`/kunde/${slug}/tilstandsanalyse`);
  revalidatePath(`/kunder/${slug}/tilstandsanalyse`);
}
