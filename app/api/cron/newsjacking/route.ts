/**
 * Newsjacking-agent — daglig kjøring kl 07:00 Oslo (= 05:00 UTC i CEST).
 * Kjøres mandag–fredag av Vercel Cron (se vercel.json).
 *
 * Flyt:
 *  1. Idempotent-sjekk: hopper hvis dagen allerede er scannet
 *  2. Hent kanal-kontekst fra Slack (siste 24t) hvis SLACK_BOT_TOKEN er satt
 *  3. Kjør Claude-agenten (lib/newsjacking-agent.ts)
 *  4. Insert scan-rad + drops i Supabase
 *  5. Post hver drop til Slack hvis SLACK_WEBHOOK_URL eller SLACK_BOT_TOKEN er satt
 */

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { runDailyScan } from "@/lib/newsjacking-agent";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const KUNDE_SLUG = "grandiosa";
const SLACK_CHANNEL_ID = "C0B2X47E97G"; // #grandiosa-newsjacking-intern
const SLACK_CHANNEL_NAVN = "grandiosa-newsjacking-intern";
const UKEDAGER = ["søn", "man", "tir", "ons", "tor", "fre", "lør"];

function todayInOslo(): { dato: string; ukedag: string; ukedagIndex: number } {
  const oslo = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Oslo" }),
  );
  const dato = oslo.toISOString().slice(0, 10);
  const ukedagIndex = oslo.getDay();
  return { dato, ukedag: UKEDAGER[ukedagIndex], ukedagIndex };
}

interface SlackMessage { user?: string; text?: string; ts?: string }

async function hentKanalKontekst(): Promise<string | undefined> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return undefined;

  const oldest = String(Math.floor(Date.now() / 1000) - 60 * 60 * 24);
  const url = `https://slack.com/api/conversations.history?channel=${SLACK_CHANNEL_ID}&oldest=${oldest}&limit=50`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = (await res.json()) as { ok: boolean; messages?: SlackMessage[] };
  if (!data.ok || !data.messages?.length) return undefined;

  return data.messages
    .filter((m) => m.text && !m.text.startsWith("🤖"))
    .map((m) => `[${new Date(parseFloat(m.ts ?? "0") * 1000).toISOString()}] ${m.text}`)
    .join("\n");
}

async function postToSlack(text: string): Promise<string | null> {
  // Foretrekk webhook (enklere oppsett); fallback til bot-token (mer kontroll)
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (webhook) {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    return res.ok ? `webhook-${Date.now()}` : null;
  }

  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return null;

  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ channel: SLACK_CHANNEL_ID, text }),
  });
  const data = (await res.json()) as { ok: boolean; ts?: string };
  return data.ok ? data.ts ?? null : null;
}

function formatSlackMelding(
  ukedag: string,
  dato: string,
  drop: { tittel: string; beskrivelse: string; du_vinkling: string; sources: { navn: string; url: string }[] },
): string {
  const datoMnd = ((): string => {
    const [, m, d] = dato.split("-");
    const mnd = ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"];
    return `${parseInt(d, 10)}. ${mnd[parseInt(m, 10) - 1]}`;
  })();
  const ukedagFull = ((): string => {
    const f = ["søndag", "mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag"];
    return f[UKEDAGER.indexOf(ukedag)];
  })();
  const sources = drop.sources.length
    ? drop.sources.map((s) => `<${s.url}|${s.navn}>`).join(" · ")
    : "—";

  return `🤖 *Newsjacking-idé · ${ukedagFull} ${datoMnd}*

*${drop.tittel}*
${drop.beskrivelse}

> "${drop.du_vinkling}"

Kilder: ${sources}

👍 / 👎 — eller skriv en kommentar i tråden hvis dere vil si noe.`;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { dato, ukedag } = todayInOslo();

  const { data: existing } = await supabase
    .from("newsjacking_scans")
    .select("id")
    .eq("kunde_slug", KUNDE_SLUG)
    .eq("dato", dato)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ skipped: "allerede kjørt", dato });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    await supabase.from("newsjacking_scans").insert({
      kunde_slug: KUNDE_SLUG, dato, ukedag,
      saker_scannet: 0, saker_etter_filter: 0, ideer_postet: 0,
      notater: "ANTHROPIC_API_KEY mangler — stub-kjøring",
    });
    return NextResponse.json({ status: "stub", dato });
  }

  // Kjør agenten
  let scanResult;
  try {
    const kontekst = await hentKanalKontekst();
    scanResult = await runDailyScan(dato, ukedag, kontekst);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[newsjacking-cron] runDailyScan feilet:", msg);
    await supabase.from("newsjacking_scans").insert({
      kunde_slug: KUNDE_SLUG, dato, ukedag,
      saker_scannet: 0, saker_etter_filter: 0, ideer_postet: 0,
      notater: `Feil i agent: ${msg.slice(0, 500)}`,
    });
    return NextResponse.json({ status: "error", dato, error: msg }, { status: 500 });
  }

  // Insert scan-rad
  await supabase.from("newsjacking_scans").insert({
    kunde_slug: KUNDE_SLUG, dato, ukedag,
    saker_scannet: scanResult.scan.saker_scannet,
    saker_etter_filter: scanResult.scan.saker_etter_filter,
    ideer_postet: scanResult.drops.length,
    notater: scanResult.scan.notater,
  });

  // Insert hvert drop og post til Slack
  const postet: string[] = [];
  for (const drop of scanResult.drops) {
    const slack_message_ts = await postToSlack(formatSlackMelding(ukedag, dato, drop));

    const { data, error } = await supabase
      .from("newsjacking_drops")
      .insert({
        kunde_slug: KUNDE_SLUG, dato, ukedag,
        tittel: drop.tittel,
        beskrivelse: drop.beskrivelse,
        du_vinkling: drop.du_vinkling,
        sources: drop.sources,
        status: "foreslatt",
        slack_channel: SLACK_CHANNEL_NAVN,
        slack_message_ts,
      })
      .select("id")
      .single();

    if (error) console.error("[newsjacking-cron] insert drop feilet:", error.message);
    else if (data) postet.push(data.id);
  }

  return NextResponse.json({
    status: "ok",
    dato,
    ukedag,
    saker_scannet: scanResult.scan.saker_scannet,
    drops_inserted: postet.length,
  });
}
