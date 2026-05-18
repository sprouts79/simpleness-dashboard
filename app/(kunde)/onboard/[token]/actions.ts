"use server";

import { revalidatePath } from "next/cache";
import {
  getSessionByToken,
  setCurrentStep,
  togglePlatformDone,
  saveInsights,
  lockInsights,
  unlockInsights,
  uploadDocument,
  addDocumentLink,
  deleteDocument,
  lifecycleStageFor,
  type OnboardingPlatform,
  type OnboardingInsights,
} from "@/lib/db-onboarding";
import { updateKundeLifecycle, updateLeveranseStatusBySlug, type LifecycleStage } from "@/lib/db-kunder";

async function revalidateKundeViews(slug: string, token: string) {
  revalidatePath(`/onboard/${token}`);
  revalidatePath(`/kunde/${slug}`);
  revalidatePath(`/kunder/${slug}`);
}

async function sessionByToken(token: string) {
  const session = await getSessionByToken(token);
  if (!session) throw new Error("Ugyldig token");
  return session;
}

export async function setStepAction(token: string, step: number) {
  const session = await sessionByToken(token);
  await setCurrentStep(session.id, step);

  // Hold kundens lifecycle_stage i sync med session-fremdriften
  const newSession = { ...session, current_step: step };
  const stage = lifecycleStageFor(newSession);
  await updateKundeLifecycle(session.client_id, stage as LifecycleStage);

  revalidatePath(`/onboard/${token}`);
}

export async function togglePlatformAction(
  token: string,
  platform: OnboardingPlatform,
  completed: boolean,
) {
  const session = await sessionByToken(token);
  await togglePlatformDone(session.id, platform, completed);
  revalidatePath(`/onboard/${token}`);
}

export async function saveInsightsAction(
  token: string,
  patch: Partial<Omit<OnboardingInsights, "id" | "session_id" | "submitted_at" | "updated_at">>,
) {
  const session = await sessionByToken(token);
  if (session.insights_locked) return; // ignore writes after lock
  await saveInsights(session.id, patch);
}

export async function submitInsightsAction(token: string) {
  const session = await sessionByToken(token);
  await lockInsights(session.id);

  // Advance lifecycle to fullført + marker onboarding-leveransen som godkjent
  await updateKundeLifecycle(session.client_id, "onboarding_fullfort");
  await updateLeveranseStatusBySlug(session.client_id, "onboarding", "godkjent");

  await revalidateKundeViews(session.client_id, token);
}

/**
 * Test-mode: åpne en allerede innsendt onboarding for redigering.
 * Tilbakefører kunden til Steg 2 og fjerner submitted_at.
 * Brukes under utvikling; vil senere være intern admin-funksjon.
 */
export async function unlockInsightsAction(token: string) {
  const session = await sessionByToken(token);
  await unlockInsights(session.id);
  await updateKundeLifecycle(session.client_id, "onboarding_steg_2");
  await updateLeveranseStatusBySlug(session.client_id, "onboarding", "under_utvikling");
  await revalidateKundeViews(session.client_id, token);
}

export async function uploadDocumentAction(
  token: string,
  formData: FormData,
  category: "strategy" | "budget" = "strategy",
) {
  const session = await sessionByToken(token);
  if (session.insights_locked) throw new Error("Onboarding er låst");

  const file = formData.get("file") as File | null;
  if (!file) throw new Error("Ingen fil");

  const buf = await file.arrayBuffer();
  await uploadDocument(session.id, file.name, buf, file.type || "application/octet-stream", category);
  revalidatePath(`/onboard/${token}`);
}

export async function addLinkAction(
  token: string,
  url: string,
  category: "strategy" | "budget" = "strategy",
) {
  const session = await sessionByToken(token);
  if (session.insights_locked) throw new Error("Onboarding er låst");
  await addDocumentLink(session.id, url, null, category);
  revalidatePath(`/onboard/${token}`);
}

export async function deleteDocumentAction(token: string, docId: number) {
  const session = await sessionByToken(token);
  if (session.insights_locked) throw new Error("Onboarding er låst");
  await deleteDocument(session.id, docId);
  revalidatePath(`/onboard/${token}`);
}
