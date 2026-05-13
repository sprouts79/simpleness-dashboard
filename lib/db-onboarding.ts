/**
 * Onboarding-modul — server-only data layer.
 * Klient-trygge typer + konstanter ligger i lib/types-onboarding.ts.
 */

import "server-only";
import { randomBytes } from "crypto";
import { supabase } from "./supabase";
import {
  PLATFORMS,
  type OnboardingPlatform,
  type OnboardingSession,
  type OnboardingAccess,
  type OnboardingInsights,
  type OnboardingDocument,
} from "./types-onboarding";

// Re-export så server-kode kan importere alt fra ett sted
export * from "./types-onboarding";

// ────────────────────────────────────────────────────────────
// Token-generering
// ────────────────────────────────────────────────────────────

function generateToken(): string {
  return randomBytes(16).toString("base64url");
}

// ────────────────────────────────────────────────────────────
// Mutations
// ────────────────────────────────────────────────────────────

export async function createOnboardingSession(clientId: string): Promise<{ token: string }> {
  const token = generateToken();

  const { data: session, error: sessionError } = await supabase
    .from("onboarding_sessions")
    .insert({ token, client_id: clientId, current_step: 0 })
    .select("id")
    .single();

  if (sessionError) throw new Error(`createOnboardingSession: ${sessionError.message}`);

  const sessionId = session.id;

  const accessRows = PLATFORMS.map((p) => ({
    session_id: sessionId,
    platform: p.id,
    required: p.required,
    completed: false,
  }));

  const { error: accessError } = await supabase.from("onboarding_access").insert(accessRows);
  if (accessError) throw new Error(`createOnboardingSession access: ${accessError.message}`);

  const { error: insightError } = await supabase
    .from("onboarding_insights")
    .insert({ session_id: sessionId });
  if (insightError) throw new Error(`createOnboardingSession insights: ${insightError.message}`);

  return { token };
}

// ────────────────────────────────────────────────────────────
// Queries
// ────────────────────────────────────────────────────────────

export async function getSessionByToken(token: string): Promise<OnboardingSession | null> {
  const { data, error } = await supabase
    .from("onboarding_sessions")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (error) throw new Error(`getSessionByToken: ${error.message}`);
  return data as OnboardingSession | null;
}

export async function getSessionByClientId(clientId: string): Promise<OnboardingSession | null> {
  const { data, error } = await supabase
    .from("onboarding_sessions")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`getSessionByClientId: ${error.message}`);
  return data as OnboardingSession | null;
}

export async function getAccess(sessionId: string): Promise<OnboardingAccess[]> {
  const { data, error } = await supabase
    .from("onboarding_access")
    .select("*")
    .eq("session_id", sessionId);

  if (error) throw new Error(`getAccess: ${error.message}`);
  const order = new Map(PLATFORMS.map((p, i) => [p.id, i]));
  return (data ?? []).sort((a, b) => (order.get(a.platform) ?? 0) - (order.get(b.platform) ?? 0)) as OnboardingAccess[];
}

export async function getInsights(sessionId: string): Promise<OnboardingInsights | null> {
  const { data, error } = await supabase
    .from("onboarding_insights")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (error) throw new Error(`getInsights: ${error.message}`);
  return data as OnboardingInsights | null;
}

export async function getDocuments(sessionId: string): Promise<OnboardingDocument[]> {
  const { data, error } = await supabase
    .from("onboarding_documents")
    .select("*")
    .eq("session_id", sessionId)
    .order("uploaded_at", { ascending: false });

  if (error) throw new Error(`getDocuments: ${error.message}`);
  return (data ?? []) as OnboardingDocument[];
}

// ────────────────────────────────────────────────────────────
// Updates
// ────────────────────────────────────────────────────────────

async function bumpLastActive(sessionId: string): Promise<void> {
  await supabase
    .from("onboarding_sessions")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", sessionId);
}

export async function setCurrentStep(sessionId: string, step: number): Promise<void> {
  const { error } = await supabase
    .from("onboarding_sessions")
    .update({ current_step: step, last_active_at: new Date().toISOString() })
    .eq("id", sessionId);
  if (error) throw new Error(`setCurrentStep: ${error.message}`);
}

export async function togglePlatformDone(
  sessionId: string,
  platform: OnboardingPlatform,
  completed: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("onboarding_access")
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq("session_id", sessionId)
    .eq("platform", platform);
  if (error) throw new Error(`togglePlatformDone: ${error.message}`);
  await bumpLastActive(sessionId);
}

export async function saveInsights(
  sessionId: string,
  patch: Partial<Omit<OnboardingInsights, "id" | "session_id" | "submitted_at" | "updated_at">>,
): Promise<void> {
  const { error } = await supabase
    .from("onboarding_insights")
    .update(patch)
    .eq("session_id", sessionId);
  if (error) throw new Error(`saveInsights: ${error.message}`);
  await bumpLastActive(sessionId);
}

export async function lockInsights(sessionId: string): Promise<void> {
  const now = new Date().toISOString();

  const { error: insErr } = await supabase
    .from("onboarding_insights")
    .update({ submitted_at: now })
    .eq("session_id", sessionId);
  if (insErr) throw new Error(`lockInsights: ${insErr.message}`);

  const { error: sesErr } = await supabase
    .from("onboarding_sessions")
    .update({ insights_locked: true, current_step: 3, completed_at: now, last_active_at: now })
    .eq("id", sessionId);
  if (sesErr) throw new Error(`lockInsights session: ${sesErr.message}`);
}

// ────────────────────────────────────────────────────────────
// Storage
// ────────────────────────────────────────────────────────────

export async function uploadDocument(
  sessionId: string,
  filename: string,
  fileData: ArrayBuffer | Blob,
  mimeType: string,
): Promise<{ document: OnboardingDocument }> {
  const safeName = filename.replace(/[^\w.\-]/g, "_");
  const storagePath = `${sessionId}/${Date.now()}-${safeName}`;

  const { error: upErr } = await supabase.storage
    .from("onboarding-documents")
    .upload(storagePath, fileData, { contentType: mimeType });
  if (upErr) throw new Error(`uploadDocument upload: ${upErr.message}`);

  const sizeBytes =
    fileData instanceof Blob ? fileData.size : (fileData as ArrayBuffer).byteLength;

  const { data, error } = await supabase
    .from("onboarding_documents")
    .insert({
      session_id: sessionId,
      filename,
      storage_path: storagePath,
      size_bytes: sizeBytes,
      mime_type: mimeType,
    })
    .select("*")
    .single();

  if (error) throw new Error(`uploadDocument insert: ${error.message}`);
  await bumpLastActive(sessionId);
  return { document: data as OnboardingDocument };
}
