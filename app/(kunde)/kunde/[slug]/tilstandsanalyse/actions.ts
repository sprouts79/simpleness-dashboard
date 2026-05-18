"use server";

import { revalidatePath } from "next/cache";
import { getKunde } from "@/lib/db-kunder";
import {
  setResponse,
  upsertConfig,
  type TilstandsanalyseConfig,
} from "@/lib/db-tilstandsanalyse";
import type { TrackingMode } from "@/lib/checklist-data";

async function resolveClientId(slug: string): Promise<string> {
  const kunde = await getKunde(slug);
  if (!kunde) throw new Error(`Kunde ikke funnet: ${slug}`);
  return kunde.id;
}

export async function setItemCheckedAction(
  slug: string,
  quarter: string,
  itemId: string,
  checked: boolean,
): Promise<void> {
  const clientId = await resolveClientId(slug);
  await setResponse(clientId, quarter, itemId, checked);
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
