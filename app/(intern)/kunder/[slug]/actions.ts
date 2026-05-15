"use server";

import { revalidatePath } from "next/cache";
import {
  aktiverLeveranse,
  getKunde,
  updateKundeRadgiver,
  updateKundeSlackInvite,
} from "@/lib/db-kunder";
import { RADGIVER_NAVN } from "@/lib/radgivere";

export async function saveSlackInviteAction(slug: string, url: string | null): Promise<{ ok: boolean; error?: string }> {
  try {
    await updateKundeSlackInvite(slug, url);
    revalidatePath(`/kunder/${slug}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Ukjent feil" };
  }
}

export async function saveRadgiverAction(slug: string, navn: string): Promise<{ ok: boolean; error?: string }> {
  if (!RADGIVER_NAVN.includes(navn)) {
    return { ok: false, error: "Ukjent rådgiver" };
  }
  try {
    await updateKundeRadgiver(slug, navn);
    revalidatePath(`/kunder/${slug}`);
    revalidatePath(`/kunder`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Ukjent feil" };
  }
}

export async function aktiverLeveranseAction(
  kundeSlug: string,
  leveranseSlug: string,
  leveranseNavn: string,
  kategori: "performance" | "prosjekter",
): Promise<{ ok: boolean; error?: string }> {
  try {
    const kunde = await getKunde(kundeSlug);
    if (!kunde) return { ok: false, error: "Kunde ikke funnet" };
    await aktiverLeveranse(kunde.id, leveranseSlug, leveranseNavn, kategori);
    revalidatePath(`/kunder/${kundeSlug}`);
    revalidatePath(`/kunde/${kundeSlug}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Ukjent feil" };
  }
}
