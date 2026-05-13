"use server";

import { revalidatePath } from "next/cache";
import { createKunde, type CreateKundeInput } from "@/lib/db-kunder";
import { createOnboardingSession } from "@/lib/db-onboarding";

export interface NyKundeResult {
  ok: boolean;
  error?: string;
  slug?: string;
  token?: string;
}

export async function opprettKundeAction(input: CreateKundeInput): Promise<NyKundeResult> {
  if (!input.name?.trim() || !input.slug?.trim()) {
    return { ok: false, error: "Navn og slug er påkrevd" };
  }
  if (!input.contactName?.trim() || !input.contactEmail?.trim()) {
    return { ok: false, error: "Kontaktperson hos kunden er påkrevd" };
  }
  if (!input.simplenessContact) {
    return { ok: false, error: "Velg Simpleness-kontakt" };
  }

  try {
    const { kunde } = await createKunde(input);
    const { token } = await createOnboardingSession(kunde.id);
    revalidatePath("/kunder");
    return { ok: true, slug: kunde.slug, token };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Ukjent feil" };
  }
}
