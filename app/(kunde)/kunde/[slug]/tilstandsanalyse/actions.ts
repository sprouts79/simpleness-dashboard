"use server";

import { revalidatePath } from "next/cache";
import { getKunde } from "@/lib/db-kunder";
import {
  upsertConfig,
  upsertResponse,
  type ItemState,
  type Assignee,
  type TilstandsanalyseConfig,
} from "@/lib/db-tilstandsanalyse";
import type { TrackingMode } from "@/lib/checklist-data";

async function resolveClientId(slug: string): Promise<string> {
  const kunde = await getKunde(slug);
  if (!kunde) throw new Error(`Kunde ikke funnet: ${slug}`);
  return kunde.id;
}

export async function setItemStateAction(
  slug: string,
  quarter: string,
  itemId: string,
  state: ItemState | null,
): Promise<void> {
  const clientId = await resolveClientId(slug);
  await upsertResponse(clientId, quarter, itemId, { state });
  revalidatePath(`/kunde/${slug}/tilstandsanalyse`);
}

export async function setItemNoteAction(
  slug: string,
  quarter: string,
  itemId: string,
  note: string | null,
): Promise<void> {
  const clientId = await resolveClientId(slug);
  await upsertResponse(clientId, quarter, itemId, { note });
  revalidatePath(`/kunde/${slug}/tilstandsanalyse`);
}

export async function setItemAssigneeAction(
  slug: string,
  quarter: string,
  itemId: string,
  assignee: Assignee | null,
): Promise<void> {
  const clientId = await resolveClientId(slug);
  await upsertResponse(clientId, quarter, itemId, { assignee });
  revalidatePath(`/kunde/${slug}/tilstandsanalyse`);
}

export async function setTrackingModeAction(slug: string, mode: TrackingMode): Promise<void> {
  const clientId = await resolveClientId(slug);
  await upsertConfig(clientId, { tracking_mode: mode });
  revalidatePath(`/kunde/${slug}/tilstandsanalyse`);
}

export async function setSnapActiveAction(slug: string, active: boolean): Promise<void> {
  const clientId = await resolveClientId(slug);
  await upsertConfig(clientId, { snap_active: active });
  revalidatePath(`/kunde/${slug}/tilstandsanalyse`);
}

export async function setPlatformAction(
  slug: string,
  patch: Partial<Pick<TilstandsanalyseConfig, "platform">>,
): Promise<void> {
  const clientId = await resolveClientId(slug);
  await upsertConfig(clientId, patch);
  revalidatePath(`/kunde/${slug}/tilstandsanalyse`);
}
