/**
 * Newsjacking-agent — daglig kjøring kl 07:00 Oslo (= 05:00 UTC i CEST).
 * Kjøres mandag–fredag av Vercel Cron (se vercel.json).
 *
 * Status i pilot:
 *   - Rammeverket (cron, Slack-notifikasjon, Supabase scan-rad) er live.
 *   - Selve scan-logikken (Claude API med web-tools) bygges når ANTHROPIC_API_KEY
 *     er satt på prosjektet. Inntil da: cron poster en "agenten venter på key"-melding
 *     og oppretter en tom scan-rad slik at viewet viser dagens dato.
 */

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min

const KUNDE_SLUG = "grandiosa";
const SLACK_CHANNEL = "C0B2X47E97G"; // #grandiosa-newsjacking-intern

const UKEDAGER = ["søn", "man", "tir", "ons", "tor", "fre", "lør"];

function todayInOslo(): { dato: string; ukedag: string; ukedagIndex: number } {
  const oslo = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Oslo" }),
  );
  const dato = oslo.toISOString().slice(0, 10);
  const ukedagIndex = oslo.getDay();
  return { dato, ukedag: UKEDAGER[ukedagIndex], ukedagIndex };
}

async function postToSlack(text: string): Promise<string | null> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    console.warn("[newsjacking-cron] SLACK_BOT_TOKEN mangler — hopper over Slack-post");
    return null;
  }
  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ channel: SLACK_CHANNEL, text }),
  });
  const data = (await res.json()) as { ok: boolean; ts?: string; error?: string };
  if (!data.ok) {
    console.error("[newsjacking-cron] Slack-post feilet:", data.error);
    return null;
  }
  return data.ts ?? null;
}

export async function GET(request: Request) {
  // Vercel Cron sender Authorization: Bearer <CRON_SECRET>
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { dato, ukedag, ukedagIndex } = todayInOslo();

  // Skip helger eksplisitt (Vercel cron-uttrykket dekker mandag-fredag,
  // men double-check her i tilfelle manuell trigger)
  if (ukedagIndex === 0 || ukedagIndex === 6) {
    return NextResponse.json({ skipped: "helg", dato, ukedag });
  }

  // Idempotent: hvis vi allerede har en scan-rad for dagen, ikke kjør igjen
  const { data: existing } = await supabase
    .from("newsjacking_scans")
    .select("id")
    .eq("kunde_slug", KUNDE_SLUG)
    .eq("dato", dato)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ skipped: "allerede kjørt", dato });
  }

  const harClaudeKey = !!process.env.ANTHROPIC_API_KEY;

  if (!harClaudeKey) {
    // Stub-modus: opprett tom scan-rad + Slack-melding om at agenten venter
    await supabase.from("newsjacking_scans").insert({
      kunde_slug: KUNDE_SLUG,
      dato,
      ukedag,
      saker_scannet: 0,
      saker_etter_filter: 0,
      ideer_postet: 0,
      notater: "ANTHROPIC_API_KEY mangler — stub-kjøring",
    });
    await postToSlack(
      `🤖 *Newsjacking-agent · ${ukedag} ${dato}*\n\nAgenten er planlagt å kjøre, men venter på at \`ANTHROPIC_API_KEY\` settes på prosjektet. Ingen scanning utført i dag.`,
    );
    return NextResponse.json({ status: "stub", dato, reason: "ANTHROPIC_API_KEY missing" });
  }

  // TODO: full scan-logikk når ANTHROPIC_API_KEY er på plass.
  // Plan:
  //   1. Last spec.md + playbook.md + raw/eksempler-fra-teamet.md inn som system-prompt
  //   2. Hent siste 24t kanal-meldinger fra Slack (for kalibrering + nye kilder/eksempler)
  //   3. Kjør Claude med web_search/web_fetch tools mot alle 10 Tier 1 + Tier 2
  //   4. Parse strukturert output (drops + scan-stats)
  //   5. Insert i newsjacking_drops + newsjacking_scans
  //   6. Post hver drop som egen Slack-melding, lagre slack_message_ts

  return NextResponse.json({ status: "not implemented", dato });
}
