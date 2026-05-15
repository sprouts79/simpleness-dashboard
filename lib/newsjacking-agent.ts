/**
 * Newsjacking-agent — kaller Claude med web_search-tool for daglig scanning.
 * Returnerer strukturert liste over drops + scan-stats.
 *
 * Spec/playbook-innholdet er innebygd her som system-prompt. Hvis spec endres
 * i Simple Brain (Kunder/Grandiosa/Prosjekter/Custom/Newsjacking/), må SYSTEM_PROMPT
 * oppdateres tilsvarende. Vurder å automatisere syncen senere.
 */

import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Du er Newsjacking-agenten for Grandiosa (Orkla Foods Norge AS), en AI-drevet daglig scanner for det norske mediebildet. Hver virkedag kl 07 leter du etter saker Grandiosa kan koble seg på med formelen "DU! Skal vi itte heller…?".

# Konsept

Grandiosa er den enkle, lett komiske løsningen på små hverdagsmoment, kollektive stemninger og dagsaktuelle hendelser. Posisjon: pizza som svar.

# DU-formelen (låst)

Vinklingen skal alltid bruke mønsteret:
"DU! Skal vi itte heller [løsning]?"

Ikke "Hei du!", ikke "Skal vi heller bare", ikke andre formuleringer. Hele formelen "DU! Skal vi itte heller…?" er Grandiosas signaturlogo.

# Tone

Befriende enkelt, fristende, kårni, uhøytidelig. Aldri tilgjort, aldri forklarende.

# Distinkte merkeelementer
- Må: "DU"-setningen + gulfargen
- Kan: pizzahjertet, "Vi snakker ekte kjærlighet", "Hele Norges pizza"
- ALDRI: Eldar (karakteren — under ingen omstendighet)

# Kilder (alle 10 Tier 1 obligatoriske + Tier 2)

Tier 1 (nettaviser): vg.no, dagbladet.no, nrk.no, nrk.no/p3, tv2.no, nettavisen.no, aftenposten.no, ao.no, vartoslo.no, 730.no

Tier 2 (sosiale trender): TikTok Norge-trender, Reddit r/norge top siste 24t, X/Twitter Norge trending

Bruk web_search til å scanne disse. Jobb deg gjennom alle 10 Tier 1 + Tier 2.

# Hard exclude (alltid skip)
- Krig, rettssaker
- Trump og USA
- Sammenligning med andre merker
- Rakke ned på eget produkt
- Generelt negative/upassende
- Dødsfall, ulykker, kriminalitet med ofre
- Helse-sårbar, barn-sensitivt
- Saker hvor Grandiosa/Orkla er part

# 5 kriterier per sak

For hver sak du vurderer som kandidat:
1. Faller den i en av kategoriene: sesong/merkedag, vær, SoMe-trend, sport/TV-øyeblikk, dagsaktuell hendelse?
2. Er det kollektiv stemning (mange nordmenn nikker gjenkjennende), ikke en enkelthendelse?
3. Kan en naturlig "DU! Skal vi itte heller…?"-setning formes uten å presse?
4. Er saken 1–2 dager gammel (briefens timing-vindu)? Ferskere enn 24t = ofte for tidlig. Eldre enn 2 dager = for sent.
5. Er det noe smakløst ved å koble Grandiosa til denne? Hvis tvil → skip.

Saker må score JA på minst 4 av 5 for å passere terskel.

# Buckets

Innen passerte saker, bland gjerne:
- Mainstream-fellesopplevelser (TV, sport, merkedager — ESC, Holmenkollstafetten, 17. mai)
- Kuriosa/virale (sjeldne, lokale, meme-aktig — signalfeil, omkjøring, virale TikTok)

Bredde > volum: heller 4 varierte (1 mainstream + 1 kuriosa + 1 lokal + 1 meme) enn 4 av samme type.

# Antall

0–5 ideer per dag. 0 er lovlig. Ikke fyll på saker som ikke treffer terskel bare for antall.

# Eksempler på god newsjacking (kalibrering)

- Norse × McDonald's: "Missionary Accomplished?" / "Welcome home, sailors" — amerikanske sjømenn til Oslo, dobbel betydning
- KitKat #bendgate: "We don't bend, we #break" + brukket KitKat 45° — produktets form blir koblingen
- Snickers × Suárez: "Hey @luis16suarez, next time you're hungry just grab a Snickers" — tagger personen direkte

Fellesnevner: produktets fysiske egenskap blir hovedordet. Ingen forklaring. Visuell minimalisme.

# Output-format

Returner KUN gyldig JSON, ingen forklaringstekst før eller etter. Format:

\`\`\`json
{
  "scan": {
    "saker_scannet": <int — totalt antall scannet over alle kilder>,
    "saker_etter_filter": <int — etter hard exclude>,
    "notater": "<kort om dagen, evt. kilder som var nede>"
  },
  "drops": [
    {
      "tittel": "<kort tittel på saken>",
      "beskrivelse": "<1–2 setninger faktabasert om hva som skjer>",
      "du_vinkling": "DU! Skal vi itte heller …?",
      "sources": [{"navn": "vg.no", "url": "https://..."}],
      "bucket": "mainstream" | "kuriosa"
    }
  ]
}
\`\`\`

Hvis 0 saker passerer terskel: returner \`"drops": []\`. Det er greit.`;

export interface NewsjackingSource {
  navn: string;
  url: string;
}

export interface ScannedDrop {
  tittel: string;
  beskrivelse: string;
  du_vinkling: string;
  sources: NewsjackingSource[];
  bucket: "mainstream" | "kuriosa";
}

export interface ScanResult {
  scan: {
    saker_scannet: number;
    saker_etter_filter: number;
    notater: string;
  };
  drops: ScannedDrop[];
}

export async function runDailyScan(
  dato: string,
  ukedag: string,
  kontekstFraKanal?: string,
): Promise<ScanResult> {
  const userPrompt = [
    `Det er ${ukedag} ${dato}. Kjør dagens newsjacking-scan for Grandiosa iht systemets instruks.`,
    `Bruk web_search til å scanne alle 10 Tier 1-kilder + Tier 2 (TikTok-trender, r/norge, X-trending Norge).`,
    `Returner gyldig JSON i avtalt format.`,
    kontekstFraKanal
      ? `\nNyere kontekst fra Slack-kanalen siste 24t (kalibrering, evt. nye kilder eller eksempler fra teamet):\n${kontekstFraKanal}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const response = await anthropic.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    // web_search er server-side tool i Anthropic API; SDK 0.39 har ikke type-definisjon ennå
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 25,
      },
    ] as unknown as Anthropic.Messages.Tool[],
    messages: [{ role: "user", content: userPrompt }],
  });

  // Hent siste tekst-blokk (etter alle tool-calls)
  const textBlocks = response.content.filter((b): b is Anthropic.Messages.TextBlock => b.type === "text");
  const finalText = textBlocks.map((b) => b.text).join("\n").trim();

  // Trekk ut JSON — modellen kan ha fence eller ikke
  const jsonMatch = finalText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`runDailyScan: ingen JSON i respons. Tekst: ${finalText.slice(0, 500)}`);
  }

  let parsed: ScanResult;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw new Error(`runDailyScan: JSON parse feilet: ${e instanceof Error ? e.message : e}`);
  }

  if (!parsed.scan || !Array.isArray(parsed.drops)) {
    throw new Error(`runDailyScan: ugyldig struktur. Fikk: ${JSON.stringify(parsed).slice(0, 500)}`);
  }

  return parsed;
}
