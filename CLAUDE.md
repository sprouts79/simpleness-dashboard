# Simpleness Dashboard — Claude Code Instructions

Du er ansvarlig for å bygge og deploye Simpleness Agency Dashboard autonomt.
Spør ikke om godkjenning for vanlige operasjoner — bare kjør.

---

## Prosjektoversikt

Byrå-dashboard for Simpleness (performance marketing agency, ~6 ansatte).
Viser Meta Ads-data for alle kunder på ett sted: performance, rolling reach og creative-analyse.

**Stack:** Next.js · Supabase · Vercel  
**Repo:** https://github.com/sprouts79/simpleness-dashboard  
**Live:** https://simpleness-dashboard.vercel.app

---

## Tilganger

Alle tokens og secrets ligger i `.env.local` (ikke committed) og som Vercel environment variables.
Aldri hardcode tokens i kode eller markdown.

```
GITHUB_TOKEN=             # ghp_... (repo + workflow scope)
VERCEL_TOKEN=             # vcp_... (full account)
VERCEL_TEAM_ID=           # team_ZbyZDifI0rFPfzcaFHDYkRvm
VERCEL_PROJECT_ID=        # prj_bbjZ6oUwbxbC3K3tCLHn6kMj3NVR
META_APP_ID=              # 907138178810837
META_SYSTEM_USER_TOKEN=   # kommer
SUPABASE_URL=             # kommer
SUPABASE_SERVICE_ROLE_KEY= # kommer
```

---

## Appstruktur (målbilde)

```
simpleness-dashboard/
├── docs/               # Statiske dokumenter (live nå)
│   ├── index.html
│   ├── kravspec.html
│   └── tilgangsguide.html
├── app/                # Next.js app (bygges)
│   ├── layout.tsx
│   ├── page.tsx        # Pulse — alle kunder
│   └── [client]/
│       ├── performance/
│       ├── reach/
│       ├── creative/
│       └── rapport/
├── lib/
│   ├── meta-api.ts     # Meta Marketing API-klient
│   ├── supabase.ts     # DB-klient
│   └── types.ts
├── supabase/
│   └── migrations/     # SQL-migrasjoner
└── CLAUDE.md
```

---

## Datamodell (Supabase)

```sql
clients (id, name, meta_account_id, status, config jsonb)

meta_performance_daily (
  client_id, date, campaign_id, adset_id, ad_id,
  spend, impressions, reach, frequency,
  clicks, purchases, purchase_value,
  cpm, ctr, cpa, roas
)

meta_reach_monthly (
  client_id, month, rolling_reach, monthly_reach,
  net_new_reach, spend, cpm, frequency,
  cost_per_1k_account_reach, cost_per_1k_net_new_reach,
  pct_net_new_reach
)

meta_ads (
  ad_id, client_id, name, created_date, cohort_date,
  format, thumbnail_url, status, naming_tags jsonb
)

notes (client_id, user_id, date, entity_type, entity_id, content)

report_snapshots (client_id, period, generated_at, content jsonb, share_token)
```

---

## Metrics vi viser (ikke legg til andre uten å spørre)

**Performance:** Spend · ROAS · CPA · CPM · Frequency · CTR  
**Reach:** Rolling Reach · Net New Reach % · Cost per 1k Net New Reach  
**Creative:** Hook Rate · Hold Rate · CTR · Spend · ROAS per annonse

---

## Rolling Reach-logikk

To API-kall per uke mot Meta Insights API:
1. Perioden (uke N): `reach, impressions, frequency, spend`
2. Kumulativt fra start til uke N: `reach`

```
incremental_reach[n] = cumulative_reach[n] - cumulative_reach[n-1]
existing_reach[n]    = weekly_reach[n] - incremental_reach[n]
pct_net_new[n]       = incremental_reach[n] / weekly_reach[n] * 100
```

Nivåer: Konto → Kampanje → Ad Set → Kohort (annonser med samme created_date)

---

## Kohort-definisjon

Kohort = alle annonser med samme `created_time` dato (kalenderdag).
Heatmap: W0, W1, W2 ... Wn siden lansering.
Farging: grønn = over median for kolonnen, rød = under.

---

## Designprinsipper

- Færrest mulige metrics — alt skal drive en beslutning
- Alle rådgivere ser det samme på tvers av alle kunder
- Bygg for Meta v1, arkitektur støtter Shopify/GA4/Snap/Google i v2+
- Referanse-UI: withadinsights.com (reach) + COHORT-appen (creative)
- Font: Syne + IBM Plex Mono. Farger: #F7F5F0 bg, #0D0D0D text, #FF4D00 accent

---

## Byggeplan (i rekkefølge)

1. `npx create-next-app@latest . --typescript --tailwind --app`
2. Kjør Supabase-migrasjoner
3. Bygg Meta API-klient med rolling reach-logikk
4. Bygg Pulse-siden (alle kunder, statusdots)
5. Bygg Performance-view per kunde
6. Bygg Reach-view med reach composition chart
7. Bygg Creative kohort-tabell + gallery
8. Bygg Rapport-generator
