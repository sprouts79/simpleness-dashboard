# Simpleness Dashboard — Claude Code Instructions

Du er ansvarlig for å bygge og deploye Simpleness Agency Dashboard autonomt.
Spør ikke om godkjenning for vanlige operasjoner — bare kjør.

---

## Prosjektoversikt

Internt byrå-dashboard for Simpleness (performance marketing agency, ~6 ansatte).
Viser Meta Ads-data for alle kunder på ett sted: performance, rolling reach og creative-analyse.
Bygget for profesjonelle mediekjøpere — ikke vanity metrics, kun det som driver beslutninger.

**Stack:** Next.js 15 · TypeScript · Tailwind · Recharts · Supabase (fase 2) · Vercel  
**Repo:** https://github.com/sprouts79/simpleness-dashboard  
**Live:** https://simpleness-dashboard.vercel.app  
**Lokalt:** `Simple Brain/Simpleness/ops/test/report-dashboard/`

---

## Fase 1 (nåværende) — Mock data
App er live med realistiske mock-data for MYYK, Kokkeløren og Far-Far.
Alle skjermer fungerer og er navigerbare.

## Fase 2 (venter på tokens) — Ekte data
- Supabase: database + migrations
- Meta System User Token: datahenting via Marketing API

---

## Tilganger

Alle tokens og secrets i `.env.local` (ikke committed) og Vercel environment variables.
Aldri hardcode tokens i kode eller markdown.

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
report-dashboard/
├── app/
│   ├── layout.tsx              # Root layout — sidebar + main
│   ├── page.tsx                # Pulse — alle kunder
│   └── [client]/
│       ├── layout.tsx          # Client-layout med tabs
│       ├── performance/page.tsx
│       ├── reach/page.tsx
│       └── creative/page.tsx
├── components/
│   ├── layout/Sidebar.tsx
│   ├── ui/KpiCard.tsx
│   ├── ui/SectionHeader.tsx
│   ├── charts/SpendTrendChart.tsx
│   ├── charts/ReachCompositionChart.tsx
│   ├── charts/CreativeChurnChart.tsx
│   ├── creative/CohortTable.tsx
│   └── creative/AdGallery.tsx
├── lib/
│   ├── types.ts                # Alle TypeScript-typer
│   └── mock-data.ts            # Mock-data for alle kunder
├── docs/                       # Statiske dokumenter
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

## Designsystem

- **Tokens:** Simpleness tokens.css (fra `simpleness-design-system.vercel.app`)
- **Farger:** `#FFFFFF` bg · `#090A08` tekst · `#89FF58` accent (sparsomt) · `#515B12` link/interactive
- **Font UI:** Plus Jakarta Sans (Google Fonts)
- **Font data:** IBM Plex Mono (alle tall/metrics)
- **Prinsipp:** Minst mulig farger — typografi og whitespace gjør jobben

---

## Neste steg (fase 2)

1. Sett opp Supabase-prosjekt → kjør migrations fra `lib/types.ts`-skjemaet
2. Bytt ut mock-data med Supabase-queries
3. Bygg Meta API-klient (`lib/meta-api.ts`) med rolling reach-logikk
4. Koble til System User Token og ad account IDs
5. Bygg Rapport-generator (skjerm 5)
