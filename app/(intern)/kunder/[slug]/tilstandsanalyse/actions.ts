"use server";

import { revalidatePath } from "next/cache";
import {
  startDraft,
  upsertItem,
  approveVersjon,
  reopenForEdit,
  type AuditItemState,
} from "@/lib/db-tilstandsanalyse";

export async function startDraftAction(slug: string): Promise<{ stateId: string }> {
  const res = await startDraft(slug);
  revalidatePath(`/kunder/${slug}/tilstandsanalyse`);
  return res;
}

export async function setItemAction(
  slug: string,
  stateId: string,
  itemId: string,
  patch: { state?: AuditItemState; note?: string | null; assignee?: "kunde" | null },
) {
  await upsertItem(stateId, itemId, patch);
  revalidatePath(`/kunder/${slug}/tilstandsanalyse`);
}

export async function approveAction(slug: string, stateId: string, godkjentAv: string) {
  await approveVersjon(stateId, godkjentAv);
  revalidatePath(`/kunder/${slug}/tilstandsanalyse`);
  revalidatePath(`/kunde/${slug}/tilstandsanalyse`);
}

export async function reopenAction(slug: string, stateId: string) {
  await reopenForEdit(stateId);
  revalidatePath(`/kunder/${slug}/tilstandsanalyse`);
  revalidatePath(`/kunde/${slug}/tilstandsanalyse`);
}
