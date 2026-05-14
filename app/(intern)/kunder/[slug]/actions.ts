"use server";

import { revalidatePath } from "next/cache";
import { updateKundeSlackInvite } from "@/lib/db-kunder";

export async function saveSlackInviteAction(slug: string, url: string | null): Promise<{ ok: boolean; error?: string }> {
  try {
    await updateKundeSlackInvite(slug, url);
    revalidatePath(`/kunder/${slug}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Ukjent feil" };
  }
}
