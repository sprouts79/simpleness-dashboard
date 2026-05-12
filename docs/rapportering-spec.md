---
title: Rapportering — UX-skisse v0.1
updated: 2026-05-12
status: utkast — sparring med Jonas pågår
---

# Rapportering

Én samlet flate for hele rapporteringsleveransen — erstatter dagens `oversikt`, `forecast`, `kreativ rapport` og `reach`. Bygget på drilldown-prinsippet fra `prototype-lab-v3` og dagens creative-rapport.

---

## Designprinsipp

**Én rapportering, fire zoom-nivåer.**

```
Nivå 1 — Konto       "Er vi der vi skal være?"
   ↓
Nivå 2 — Kanal       "Hvor kommer det fra?"  (Meta · Google · Snap · TikTok · OHH · manuelt)
   ↓
Nivå 3 — Kampanje    "Hvorfor presterer kanalen slik?"
   ↓
Nivå 4 — Annonse     "Hvilke assets driver dette?"  (for kreative kanaler)
```

Navigeres via breadcrumb øverst — alltid synlig, alltid klikkbar tilbake.

**Tre kontekst-vinkler på hvert nivå:**

1. **Tilstand** — KPI-hero med outcome (kundens språk) + delta vs forrige + delta vs forecast
2. **Fordeling** — stacked spend-bar som viser hvor pengene gikk (kanal/kampanje/ad-status)
3. **Sammenheng** — sammenligning mot tilstøtende ting (andre kanaler, andre annonser i samme cohort/tema/format)

Sammenheng-laget er det som gjør at man "ser hva man ser på" — ikke en isolert tabell, men data i kontekst.

---

## To-lags KPI-modell

| Lag | Eksempler | Synlig for |
|---|---|---|
| **Outcome** (kundens språk) | Nye kunder · CAC · Inntekt · ROAS · Spend mot budsjett | Kunde + intern |
| **Diagnose** (mediekjøperens språk) | CPMR · Net new % · Hook · Hold · CTR · Frekvens | Intern alltid; kunde ved drilldown |

Kundens 1-3 valgte outcome-KPIer defineres i Budsjett-leveransen og hentes inn på Nivå 1. For Kokkeløren: *Nye kunder* + *CAC*.

Toggle "Diagnose-modus" øverst (intern-only): viser eller skjuler diagnose-laget på alle nivåer samtidig.

---

## Nivå 1 — Konto

**Path:** `/[client]/rapportering` (intern) · `/kunde/[slug]/rapportering` (kunde)
**Breadcrumb:** *"Konto"* (ingen lenke siden vi er på toppen)
**Default-periode:** Forrige hele måned · sammenligning vs forrige periode + vs forecast

### Layout

```
┌─ Header ──────────────────────────────────────────────────────────────────┐
│  Datakilder: Meta · Google · Snap · OHH        Periode: Mai 2026  ▾       │
│                                                                           │
│  Konto                                                                    │
└───────────────────────────────────────────────────────────────────────────┘

┌─ Hero — kundens KPIer mot target ─────────────────────────────────────────┐
│                                                                           │
│   Nye kunder           CAC                  Spend (mot budsjett)          │
│   142                  380 kr               180k / 250k                   │
│   ↗ 89 % av mål        ↘ 5 % under mål      72 % brukt                    │
│   Mål: 160             Mål: 400 kr          ████████░░░ av kvartal        │
│                                                                           │
│   (kunde-only stopper her — eller toggle for å se mer)                    │
│   ─────────────────────────────────────────────────────────────────       │
│   Inntekt              ROAS                 Spend forecast Q2             │
│   378k                 2.1x                 180k / 720k (25 %)            │
│   ↗ +12 % vs april     ↗ +0.3 vs april      På sporet                     │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘

┌─ Spend-fordeling — alle kanaler ──────────────────────────────────────────┐
│                                                                           │
│   ████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░                  │
│   ▌Meta 110k (61 %)  ▌Google 35k (19 %)  ▌Snap 18k (10 %)  ▌OHH 17k (9 %) │
│                                                                           │
│   Per mål-type:                                                           │
│   ████████████████████████░░░░░░░░░░                                      │
│   ▌Konvertering 145k (81 %)  ▌Rekkevidde 35k (19 %)                       │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘

┌─ Kanal-liste (klikkbare cards) ───────────────────────────────────────────┐
│                                                                           │
│  ▶ Meta        Spend 110k    CAC 320 kr   42 nye   ROAS 2.1x          →   │
│                ↘ -8 %         ↘ -5 %       ↗ +12 %  ↗ +12 %               │
│                                                                           │
│  ▶ Google      Spend 35k     CAC 280 kr   28 nye   ROAS 2.6x          →   │
│                ↗ +20 %        ↘ -10 %      ↗ +25 %  ↗ +15 %               │
│                                                                           │
│  ▶ Snap        Spend 18k     CAC 510 kr   12 nye   ROAS 1.4x          →   │
│                ↘ -30 %        ↗ +18 %      ↘ -20 %  ↘ -5 %                │
│                                                                           │
│  ▶ OHH         Spend 17k     CAC 850 kr   8 nye    ROAS 0.9x          →   │
│                stabil         stabil       stabil   ↘ -3 %                │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘

┌─ Mediekjøperens analyse — Mai 2026 ───────────────────────────────────────┐
│                                                                           │
│   Hva skjedde                                                             │
│   Meta-konvertering driftet jevnt, men vi flyttet 12k til Google i        │
│   uke 19 som ga utslag på CAC. Snap underpresterer — vurderer pause.      │
│                                                                           │
│   Hva videre                                                              │
│   Øk Google + Meta i juni. Test ny Snap-vinkling.                         │
│                                                                           │
│   Skrevet av Mediekjøper · 2026-05-31                                     │
│   [Rediger] (kun synlig for intern)                                       │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘

┌─ Tidligere rapporter ─────────────────────────────────────────────────────┐
│  Apr 2026  ✓ Godkjent     Mar 2026  ✓ Godkjent    Feb 2026  ✓ Godkjent    │
└───────────────────────────────────────────────────────────────────────────┘
```

**Klikk-interaksjon:**
- Klikk på en kanal i listen → drill ned til Nivå 2 (samme kanal valgt)
- Klikk på stack-segment i fordelingsbar → drill ned til Nivå 2 (kanal scoped)
- Klikk på en tidligere måned → låst snapshot for den måneden

---

## Nivå 2 — Kanal

**Eksempel:** `/[client]/rapportering/meta`
**Breadcrumb:** *"Konto › Meta"* (begge klikkbare)

### Layout

```
┌─ Header med dimensjonsfilter ─────────────────────────────────────────────┐
│                                                                           │
│  Konto › Meta                          [Alle] [Konvertering] [Rekkevidde] │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘

┌─ Hero — Meta-spesifikke KPIer ────────────────────────────────────────────┐
│                                                                           │
│   Spend          ROAS         CAC          Frekvens      Nye             │
│   110k           2.1x         320 kr       1.8           42              │
│   ↘ -8 %         ↗ +12 %      ↘ -5 %       ↗ +0.2        ↗ +12 %         │
│                                                                           │
│   [Vis diagnose] ─────────────────────────────────────────                │
│   CPMR · Net new % · Hook · Hold · CTR                                    │
│   34 kr   62 %      11.2 %  27 %    2.0 %                                 │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘

┌─ Spend-fordeling per stadium (Meta-spesifikt) ────────────────────────────┐
│                                                                           │
│   ░░░██████████████████████████████░░░░░░░░░░                             │
│   ▌Test 8k  ▌Explore 22k  ▌Exploit 58k  ▌Burnt 12k  ▌Suppressed 10k       │
│                                                                           │
│   Per mål-type:                                                           │
│   ████████████████████████░░░░░░░░░░                                      │
│   ▌Konvertering 88k (80 %)  ▌Rekkevidde 22k (20 %)                        │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘

┌─ Kampanje-liste (kompakte cards, klikkbare) ──────────────────────────────┐
│                                                                           │
│  ▶ Konvertering · BAU 2026          Spend 65k  ROAS 2.4x  CAC 298     →   │
│  ▶ Konvertering · Mai-kampanje      Spend 23k  ROAS 2.0x  CAC 345     →   │
│  ▶ Rekkevidde · TOF Q2              Spend 22k  Net new 78 %  CPMR 28  →   │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘

┌─ Sammenheng — Meta vs andre kanaler ──────────────────────────────────────┐
│                                                                           │
│            Spend       CAC      Nye        ROAS     Trend                 │
│   Meta     110k        320 kr   42         2.1x     ──────                │
│   Google   35k         280 kr   28         2.6x     ──╲                   │
│   Snap     18k         510 kr   12         1.4x     ╱──                   │
│   OHH      17k         850 kr   8          0.9x     ─stab─                │
│                                                                           │
│   Meta er størst på spend, men Google har lavest CAC.                     │
│   (autogenerert observasjon — intern-only)                                │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘

┌─ Mediekjøperens kommentar — Meta · Mai 2026 ──────────────────────────────┐
│                                                                           │
│   (valgfritt — kun hvis mediekjøper har skrevet noe spesifikt for Meta)   │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

**Klikk-interaksjon:**
- Klikk på kampanje → Nivå 3
- Klikk på "Konvertering"/"Rekkevidde"-filter → re-scope hele siden
- Klikk på annen kanal i "Sammenheng"-tabellen → bytter til den kanalens Nivå 2

---

## Nivå 3 — Kampanje

**Eksempel:** `/[client]/rapportering/meta/bau-2026`
**Breadcrumb:** *"Konto › Meta › BAU 2026"*

### Layout

```
┌─ Header ──────────────────────────────────────────────────────────────────┐
│                                                                           │
│  Konto › Meta › BAU 2026          Type: Konvertering · Mål: Kjøp         │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘

┌─ Hero — Kampanje-KPIer + kreativ-tilstand ────────────────────────────────┐
│                                                                           │
│   Spend       ROAS        CAC         Hook       Hold        Frekvens     │
│   65k         2.4x        298 kr      12.3 %     28 %        2.1          │
│   ↗ +15 %     ↗ +18 %     ↘ -10 %     Stabil     Bedrer      ↗ +0.3       │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘

┌─ Annonse-fordeling per stadium ───────────────────────────────────────────┐
│                                                                           │
│   ░░░░░░██████████████████████████████░░░░░                               │
│   ▌Test 3  ▌Explore 8  ▌Exploit 9  ▌Burnt 2  ▌Suppressed 2                │
│                                                                           │
│   Per format:                                                             │
│   Video 60 %  ·  Static 25 %  ·  Carousel 15 %                            │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘

┌─ Annonse-liste (sortérbar) ───────────────────────────────────────────────┐
│                                                                           │
│  ▌Madeleine pakker opp · v.2     Exploit  Video    Spend 18k  ROAS 3.1x → │
│  ▌Pappa i Stavanger · v.1        Exploit  Video    Spend 12k  ROAS 2.8x → │
│  ▌Profil-kokk · pro · v.1        Exploit  Static   Spend 9k   ROAS 2.4x → │
│  ▌Familie-modus tutorial · v.1   Explore  Video    Spend 4k   ROAS 1.6x → │
│  … 20 mer                                                                 │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘

┌─ Sammenheng — Cohort-heatmap (intern-only på dette nivået) ───────────────┐
│                                                                           │
│   Hvordan modnes annonser fra ulike lanseringsuker (KPI: ROAS)            │
│                                                                           │
│              W0      W1      W2      W3      Lifetime                     │
│   Mar 2026   ███     ██      ░       ░       1.8                          │
│   Apr 2026   ████    ███     ██      ░       2.4                          │
│   Mai 2026   ████    ██      ─       ─       2.7                          │
│                                                                           │
│   [Bytt KPI: spend · hook · hold · ctr · cpa · roas]                      │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## Nivå 4 — Annonse

**Eksempel:** `/[client]/rapportering/meta/bau-2026/madeleine-pakker-opp-v2`
**Breadcrumb:** *"Konto › Meta › BAU 2026 › Madeleine pakker opp · v.2"*

### Layout — kontekst-tunge

```
┌─ Header ──────────────────────────────────────────────────────────────────┐
│  Konto › Meta › BAU 2026 › Madeleine pakker opp · v.2                     │
└───────────────────────────────────────────────────────────────────────────┘

┌─ Hero — annonsen + tilstand ──────────────────────────────────────────────┐
│                                                                           │
│   ┌────────────┐    Madeleine pakker opp · v.2                            │
│   │            │    Tema: Aldri det samme to ganger                       │
│   │ thumbnail  │    Avsender: Creator · Format: Video · Lengde: 24 s      │
│   │ (klikk for │    Status: Exploit · Lansert: 2026-05-04                 │
│   │  preview)  │                                                          │
│   └────────────┘                                                          │
│                                                                           │
│   Spend     ROAS     CPA     Hook      Hold      CTR      Frekvens        │
│   18k       3.1x     298 kr  14.2 %    31 %      2.1 %    1.6             │
│   ↗ +20 %   ↗ +15 %  ↘ -8 %  Stabil    ↗ +3p     Stabil   ↗ +0.2          │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘

┌─ Utvikling over tid (siste 8 uker) ───────────────────────────────────────┐
│                                                                           │
│   [spend + ROAS dual-axis graph]      [hook + hold trend graph]           │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘

┌─ Sammenheng — innen samme tema (briefing) ────────────────────────────────┐
│                                                                           │
│   Tema "Aldri det samme to ganger" har 4 annonser kjørt:                  │
│                                                                           │
│   ▶ ●  Madeleine pakker opp · v.2 (denne)   Spend 18k  ROAS 3.1x          │
│   ▶    Aldri det samme · v.1 (lo-fi)        Spend 4k   ROAS 1.9x          │
│   ▶    Profil-kokk · pro · v.1              Spend 9k   ROAS 2.4x          │
│   ▶    Familie-modus · tutorial · v.1       Spend 4k   ROAS 1.6x          │
│                                                                           │
│   Denne annonsen er beste utøveren på temaet.                             │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘

┌─ Sammenheng — samme cohort (mai 2026 lansering) ──────────────────────────┐
│                                                                           │
│   Annonser lansert samme uke (W18):                                       │
│                                                                           │
│   ▶ ●  Madeleine pakker opp · v.2 (denne)   ROAS 3.1x                     │
│   ▶    Pappa i Stavanger · v.1              ROAS 2.8x                     │
│   ▶    Familie-modus tutorial · v.1         ROAS 1.6x                     │
│                                                                           │
│   Snitt for cohort: ROAS 2.5x — over snitt.                               │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘

┌─ Sammenheng — format-benchmark (video) ───────────────────────────────────┐
│                                                                           │
│   Snitt for video-annonser denne måneden (alle kampanjer):                │
│                                                                           │
│             Denne    Snitt video   Snitt static   Snitt carousel          │
│   ROAS      3.1x     2.3x          1.9x           2.0x                    │
│   Hook      14.2 %   11 %          —              7 %                     │
│   Hold      31 %     26 %          —              22 %                    │
│                                                                           │
│   Denne over snitt på alle dimensjoner.                                   │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

**Klikk-interaksjon:**
- Klikk på thumbnail → modal med video-preview
- Klikk på annen annonse i "Sammenheng" → drill til den annonsens Nivå 4

---

## Sidebar (intern)

```
Aktivt arbeid
─ Rapportering        ← konsoliderer Oversikt + Forecast + Kreativ rapport + Reach
─ Aktivitetsplan
─ (Forecast — fjernes, blir del av Rapportering Nivå 1)
─ (Kreativ rapport — fjernes, blir Nivå 3-4 i Rapportering)
─ (Reach — fjernes, blir diagnose-toggle på Nivå 1-2)

Statisk konfig
─ Budsjetter
─ Enhetsøkonomi
```

På kundens side er sidebaren forenklet til kundens leveranser (oversikt + Rapportering + Nyhetsbrev osv.).

---

## Toggles og filter

| Element | Hvor | Hva |
|---|---|---|
| **Periode-velger** | Header på alle nivåer | Forrige måned (default) · Inneværende måned · Kvartal · Hittil i år · Custom |
| **Sammenligning** | Header | vs Forrige periode (default) · vs Samme i fjor · vs Forecast |
| **Diagnose-modus** | Header (intern-only) | Outcome-only · Outcome + diagnose (default for intern) |
| **Dimensjonsfilter** | Nivå 2-3 | Alle · Konvertering · Rekkevidde |
| **KPI for heatmap** | Nivå 3 | Spend · Hook · Hold · CTR · CPA · ROAS |
| **Tidligere rapporter** | Nivå 1 bunn | Liste over låste snapshots |

---

## Mediekjøperens kommentar

Per nivå, alltid valgfritt:

| Nivå | Kommentar | Synlig for kunde |
|---|---|---|
| Nivå 1 (konto) | Månedlig rapport — "Hva skjedde / Hva videre" | Ja, alltid |
| Nivå 2 (kanal) | Per-kanal-notater | Valgfritt — toggles av mediekjøper |
| Nivå 3 (kampanje) | Diagnose-notater | Nei, intern-only |
| Nivå 4 (annonse) | Læring per annonse | Nei, intern-only |

Tre faste underseksjoner på Nivå 1: *Hva skjedde · Hva fungerte · Hva videre*. Fritekst på andre nivåer.

---

## Kunde vs intern — hva er forskjellen

| Element | Kunde | Intern |
|---|---|---|
| Top-KPIer Nivå 1 | Bare kundens valgte (1-3 fra Budsjett) | Samme + ROAS + Inntekt + Forecast |
| Drilldown-dybde | Til Nivå 3 (kampanje) | Til Nivå 4 (annonse) |
| Diagnose-tall (CPMR, Hook, Hold) | Skjult som default · synlig ved drilldown | Synlig |
| Mediekjøperens kommentar | Publiserte | Alle + utkast |
| Skriv-modus | Nei | Ja |
| Andre kanaler i Sammenheng | Synlig | Synlig |
| Cohort-heatmap (Nivå 3) | Skjult | Synlig |
| Format-benchmark (Nivå 4) | N/A (kommer ikke hit) | Synlig |
| Andre kunder (Puls) | Aldri | `/` viser puls på tvers |
| Tidligere rapporter | Låste månedlige snapshots | Snapshots + utkast for inneværende |

---

## Datamodell (forenklet)

```typescript
// Definert i Budsjett-leveranse, hentes inn på Nivå 1
interface KundeKPI {
  slug: string;            // "nye-kunder" | "cac" | "roas" | …
  navn: string;
  enhet: "antall" | "kr" | "x" | "%";
  hoyere_er_bedre: boolean;
  target: number;
  periodisering: "manedlig" | "kvartal";
}

// Datapunkt — én rad per kanal/kampanje/ad/dato
interface DataPunkt {
  dato: string;
  kunde_slug: string;
  kanal: "meta" | "google" | "snap" | "tiktok" | "manuell";
  mal_type: "konvertering" | "rekkevidde";
  kampanje_id?: string;
  ad_set_id?: string;
  annonse_id?: string;
  // Outcome
  spend: number;
  inntekt?: number;                 // Fra Shopify/Woo
  nye_kunder?: number;
  kjop?: number;
  // Diagnose (kun ad-platform)
  impresjoner?: number;
  reach?: number;
  net_new_reach?: number;
  hook_rate?: number;
  hold_rate?: number;
  ctr?: number;
  frekvens?: number;
}

// Forecast (fra Kampanjeplan)
interface Forecast {
  kunde_slug: string;
  periode: string;                  // "2026-Q2" eller "2026-05"
  kanal: string;
  mal_type: string;
  spend_forecast: number;
  inntekt_forecast: number;
}

// Annonse-metadata (fra kreativ-ops eller Meta)
interface Annonse {
  id: string;
  navn: string;
  kanal: string;
  kampanje_id: string;
  ad_set_id?: string;
  tema_id?: string;                 // Fra kreativ-ops
  format: "video" | "static" | "carousel" | "story";
  avsender: "brand" | "creator" | "kunde" | "ekspert" | "founder";
  produksjon: "lo-fi" | "pro" | "ai-illustrasjon" | "produktbilde";
  status: "test" | "explore" | "exploit" | "burnt" | "suppressed";
  cohort_uke: string;
  lansert: string;
  thumbnail_url?: string;
}

// Månedlig rapport-snapshot (låses ved "publiser")
interface RapportSnapshot {
  kunde_slug: string;
  periode: string;                  // "2026-05"
  publisert: string;                // ISO datetime
  publisert_av: string;
  kommentar_konto?: string;
  kommentar_per_kanal?: Record<string, string>;
  status: "utkast" | "publisert" | "godkjent_av_kunde";
}
```

Aggregator-laget bygger view-modeller per nivå fra disse rådatatabellene.

---

## Routes — Next.js-struktur

```
app/(intern)/[client]/rapportering/
├── page.tsx                       Nivå 1
├── [kanal]/
│   ├── page.tsx                   Nivå 2
│   └── [kampanje]/
│       ├── page.tsx               Nivå 3
│       └── [annonse]/
│           └── page.tsx           Nivå 4

app/(kunde)/kunde/[slug]/rapportering/
├── page.tsx                       Nivå 1 (kunde-versjon)
├── [kanal]/
│   ├── page.tsx                   Nivå 2 (kunde-versjon)
│   └── [kampanje]/
│       └── page.tsx               Nivå 3 (kunde-versjon, ingen Nivå 4)
```

Felles Breadcrumb-komponent + KpiHero + StackBar + KanalListe + KampanjeListe + AnnonseListe + CohortHeatmap + Sammenheng-paneler.

---

## Datakilder — fase

| Fase | Kilder | Hva som virker |
|---|---|---|
| **0** (i dag) | Mock-data | UI-flyt og struktur |
| **1** | Meta · Shopify · Budsjett-app (egen Supabase) | Full kjede for kunder på Meta |
| **2** | + Google · Snap · TikTok · GA4 | Multi-kanal-rapportering |
| **3** | + Manuelle annonsekostnader (OHH etc.) | Komplett spend-bilde |

Aggregator-laget designes for fase 3 fra dag én — alle datapunkter normaliseres til samme `DataPunkt`-form uansett kilde.

---

## Hva som fjernes når dette er på plass

| Side i dag | Erstattes av |
|---|---|
| `/[client]/oversikt` | Rapportering Nivå 1 |
| `/[client]/forecast` | Rapportering Nivå 1 (med "vs Forecast"-sammenligning som default) |
| `/[client]/creative` | Rapportering Nivå 2-4 (Meta) med kreativ-data integrert |
| `/[client]/creative/lab` | Fatigue-gauge blir egen view-modus på Nivå 3 |
| `/[client]/reach` | Rolling reach blir diagnose-toggle på Nivå 1-2 for Meta |

Pensjoneres etter at konsolidert Rapportering er stabil. Beholdes parallelt i en periode for sammenligning.

---

## Implementasjonsrekkefølge

1. **Datamodell + aggregator** — definer typene, bygg mock-aggregator som leverer NivaaData fra DataPunkt
2. **Felleskomponenter** — Breadcrumb, KpiHero, StackBar, KanalListe, KampanjeListe
3. **Nivå 1** — intern + kunde-versjon
4. **Nivå 2** — intern + kunde
5. **Nivå 3** — intern + kunde (med Cohort-heatmap kun intern)
6. **Nivå 4** — intern (kunde ser ikke hit)
7. **Tidligere snapshots** — låsing + bla
8. **Mediekjøperens kommentar** — skriv-modus
9. **Pensjoner gamle sider** — redirect til ny struktur

---

## Spørsmål som fortsatt henger

1. **"Mediekjøperens kommentar" — strukturert eller fritekst?** Forslag: Nivå 1 har tre felter (*Hva skjedde · Hva fungerte · Hva videre*), andre nivåer er fritekst. OK?

2. **Snapshot vs live:** forslag er inneværende måned = live, forrige måneder = låste snapshots ved første "publiser". OK?

3. **"Konvertering vs Rekkevidde" som filter eller dimensjon:** forslag er filter på Nivå 2-3 + farge-koding i listene. Ikke separate views. OK?

4. **Kunden ser Nivå 3 (kampanje), men ikke Nivå 4 (annonse).** OK eller skal de helt ned?

5. **Andre kanaler i "Sammenheng" på Nivå 2:** vis alle kanaler eller bare kanalene med spend > X kr? Stillingstaking trengs for å unngå tom row når kanalen ikke har spend.
