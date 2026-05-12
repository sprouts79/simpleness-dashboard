# Simpleness OS — Claude Code Instructions

Du er ansvarlig for å bygge og deploye Simpleness OS — byråets monolitt-applikasjon — autonomt. Spør ikke om godkjenning for vanlige operasjoner — bare kjør.

---

## Hva er Simpleness OS

Simpleness OS er én applikasjon som dekker alle kundedata-flatene:

- **Intern-view** (dashboard.simpleness.no på sikt, i dag `simpleness-os.vercel.app/`): byråets eget dashboard — pulse over alle kunder, performance/reach/creative-data per kunde, admin
- **Kunde-view** (kunde.simpleness.no/[slug] på sikt, i dag `simpleness-os.vercel.app/kunde/[slug]`): kundens grensesnitt med leveranser, status, resultater

Begge views leser fra samme datalag. Auth bestemmer scope (på sikt). I dag: URL-obscurity for kunde-view, ingen auth for intern-view.

**Stack:** Next.js 15 · TypeScript · Tailwind · Recharts · Supabase (fase 2) · Vercel
**Repo:** https://github.com/sprouts79/simpleness-os
**Live:** https://simpleness-os.vercel.app
**Lokalt:** `Simple Brain/Simpleness/Verktøy/Produksjon/Simpleness OS/`

---

## Faseplan

### Fase 1 (live) — Mock data + kundeområde-skall
- Intern-view live med mock-data for MYYK, Kokkeløren og Far-Far
- Kunde-view live med statisk leveranseliste per kunde (hardkodet)

### Fase 2 (venter på tokens) — Ekte data
- Supabase: database + migrations
- Meta System User Token: datahenting via Marketing API

### Fase 3 (senere) — Auth
- Supabase Auth + RLS for å skille intern vs kunde-tilgang
- Custom domains: `dashboard.simpleness.no` (intern), `kunde.simpleness.no/[slug]` (kunder)

### Fase 4 (senere) — Absorber andre moduler
- Ad Launcher (fra `sprouts79/adlaunch`) blir modul i samme app
- Kreativ Brief-redigering, Kampanjeplan, Budsjett-verktøy bygges som moduler

---

## Tilganger

Alle tokens og secrets i `.env.local` (ikke committed) og Vercel environment variables. Aldri hardcode tokens i kode eller markdown.

```
GITHUB_TOKEN=             # Fra Simple Brain/.config
VERCEL_TOKEN=             # vcp_... (full account)
VERCEL_TEAM_ID=           # team_ZbyZDifI0rFPfzcaFHDYkRvm
VERCEL_PROJECT_ID=        # prj_bbjZ6oUwbxbC3K3tCLHn6kMj3NVR
META_APP_ID=              # 907138178810837
META_SYSTEM_USER_TOKEN=   # Venter på BM-godkjenning
SUPABASE_URL=             # Ikke satt opp ennå
SUPABASE_SERVICE_ROLE_KEY= # Ikke satt opp ennå
```

**Kunder og ad account IDs:**
- MYYK: `act_431404084344569`
- Kokkeløren: `act_220000000000001` (placeholder — bytt ut)
- Far-Far: `act_330000000000002` (placeholder — bytt ut)

---

## Appstruktur

```
simpleness-os/
├── app/
│   ├── layout.tsx                 # Root layout — kun html/body
│   ├── globals.css
│   ├── (intern)/                  # Intern-view (Simpleness sine ansatte)
│   │   ├── layout.tsx             # Sidebar + main chrome
│   │   ├── page.tsx               # Puls — alle kunder
│   │   ├── [client]/              # Per-kunde intern view
│   │   ├── admin/
│   │   └── guide/
│   ├── (kunde)/                   # Kunde-view (eksterne kunder)
│   │   ├── layout.tsx             # Kunde-spesifikt chrome (ingen sidebar)
│   │   └── kunde/
│   │       └── [slug]/
│   │           └── page.tsx       # Kundeområde-oversikt
│   └── api/                       # Felles API for begge views
├── components/
├── lib/
│   ├── types.ts                   # Alle TypeScript-typer
│   ├── mock-data.ts               # Mock-data for performance
│   └── clients-leveranser.ts      # Statisk konfigurasjon per kunde (leveranser + status)
└── CLAUDE.md
```

---

## Metrics (ikke legg til andre uten å spørre Jonas)

**Performance:** Spend · ROAS · CPA · CPM · Frequency · CTR
**Reach:** Rolling Reach · Net New Reach % · Cost per 1k Net New Reach
**Creative:** Hook Rate · Hold Rate · CTR · Spend · ROAS per annonse

---

## Rolling Reach-logikk (kritisk)

```
incremental_reach[n] = cumulative_reach[n] - cumulative_reach[n-1]
existing_reach[n]    = weekly_reach[n] - incremental_reach[n]
pct_net_new[n]       = incremental_reach[n] / weekly_reach[n] * 100
```

To API-kall per uke: perioden (uke N) + kumulativt fra start til uke N.

---

## Kundeområde — leveranse-status

Hver leveranse hos en kunde har én av tre tilstander, samme konvensjon som tidligere kunde-kokkeloren-prototype:

| Status | Når brukes |
|---|---|
| `godkjent` | Kunden har eksplisitt godkjent — ingen åpne kommentarer |
| `til_avsjekk` | Klar for kundegjennomgang — venter på tilbakemelding |
| `under_utvikling` | Simpleness jobber fortsatt med innholdet (default ved opprettelse) |

Parent-leveranser arver fra children: alle godkjent → godkjent, ellers → under_utvikling. "Til avsjekk" er reservert for leaf-leveranser.

Datakilde i fase 1: `lib/clients-leveranser.ts`. Fase 2: Supabase med samme skjema.

---

## Designsystem

- **Tokens:** Simpleness tokens.css (fra `simpleness-design-system.vercel.app`)
- **Farger:** `#FFFFFF` bg · `#090A08` tekst · `#89FF58` accent (sparsomt) · `#515B12` link/interactive
- **Font UI:** Plus Jakarta Sans (Google Fonts)
- **Font data:** IBM Plex Mono (alle tall/metrics)
- **Prinsipp:** Minst mulig farger — typografi og whitespace gjør jobben

---

## Neste steg

1. Sett opp Supabase-prosjekt → kjør migrations fra `lib/types.ts`-skjemaet
2. Bytt ut mock-data med Supabase-queries
3. Bygg Meta API-klient (`lib/meta-api.ts`) med rolling reach-logikk
4. Koble til System User Token og ad account IDs
5. Bygg Rapport-generator
6. Migrer Kokkeløren-prototype-innhold til kunde-view (kun `kunde.simpleness.no/kokkeloren` etterhvert)
