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

### Fase 2 (pågår) — Ekte data
- Supabase: prosjekt `simpleness-dashboard` (id `kosbrmgbhpjphzlpzjrf`, navnet er pre-rename) — performance-schema operativt med 14 kunder seedet, 4 migrations applied (`001-004`)
- Meta System User Token: aktivt — datahenting via Marketing API kjører
- **Pågår 2026-05-13:** Kunder-modul + Onboarding-modul bygges som migrations 005+ på samme prosjekt

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
META_SYSTEM_USER_TOKEN=   # EAAM5...  (aktivt)
SUPABASE_PROJECT_ID=      # kosbrmgbhpjphzlpzjrf  (navn: "simpleness-dashboard" — pre-rename)
SUPABASE_URL=             # https://kosbrmgbhpjphzlpzjrf.supabase.co
SUPABASE_SERVICE_ROLE_KEY= # sb_secret_... (bypasser RLS — kun server-side)
SUPABASE_ACCESS_TOKEN=    # sbp_... (Management API — for migrations/admin)
```

Verdier ligger i `Simple Brain/.config`. Lokal `.env.local` har URL + SERVICE_ROLE_KEY + META_*. Vercel env vars synkronisert.

**Kunder:** 14 stk seedet i `clients`-tabellen — `act_*`-IDer der. Hovedkunder: MYYK (`act_431404084344569`), Kokkeløren (`act_267192904748840`), Far-Far (`act_618453770153594`). Full liste via Supabase eller `SELECT id, slug, meta_account_id FROM clients ORDER BY id`.

---

## Appstruktur

```
simpleness-os/
├── app/
│   ├── layout.tsx                       # Root layout — kun html/body
│   ├── globals.css
│   ├── (intern)/                        # Intern-view (Simpleness sine ansatte)
│   │   ├── layout.tsx                   # Sidebar + main chrome
│   │   ├── page.tsx                     # Puls — alle kunder
│   │   ├── [client]/                    # Per-kunde intern view
│   │   ├── kunder/                      # Kunder-modul (Fase 2 ↑)
│   │   │   ├── page.tsx                 # Index — alle kunder + lifecycle-stage
│   │   │   ├── ny/page.tsx              # Opprett ny kunde + onboarding-token
│   │   │   └── [slug]/
│   │   │       ├── page.tsx             # Kunde-detalj
│   │   │       └── onboarding/page.tsx  # Lese kundens onboarding-svar
│   │   ├── admin/                       # Systemkonfig (sync, debug, Meta-konto-kobling)
│   │   └── guide/
│   ├── (kunde)/                         # Kunde-view (eksterne kunder)
│   │   ├── layout.tsx                   # Kunde-spesifikt chrome (ingen sidebar)
│   │   ├── kunde/[slug]/page.tsx        # Kundeområde-oversikt
│   │   └── onboard/[token]/             # Onboarding-modul (Fase 2 ↑)
│   │       ├── page.tsx                 # Wizard-shell
│   │       └── components/              # WelcomeScreen, AccessStep, InsightStep, NextStepsScreen
│   └── api/
│       └── onboarding/                  # Token-generering, fil-upload (Fase 2 ↑)
├── components/
├── lib/
│   ├── types.ts                         # Alle TypeScript-typer
│   ├── mock-data.ts                     # Mock-data for performance
│   ├── clients-leveranser.ts            # Statisk konfigurasjon per kunde (Fase 1 — flyttes til Supabase)
│   └── supabase.ts                      # Supabase-klient (Fase 2 ↑)
├── supabase/
│   └── migrations/                      # SQL-migrations (Fase 2 ↑)
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

## Moduler

Simpleness OS er en monolitt — alle flatene under deler kodebase, datalag og auth.

| Modul | Rute | Status | Hva |
|---|---|---|---|
| Puls | `/` | live (mock) | Pulse over alle kunder |
| Per-kunde dashboard | `/[client]/oversikt` osv. | live (mock) | Performance, reach, creative, budsjett |
| **Kunder-admin** | `/kunder` | **bygges (Fase 2)** | Index over alle kunder med lifecycle-stage, opprett ny, kunde-detalj. Erstatter dagens `/admin` som Meta-konto-kobler |
| **Onboarding (kunde)** | `/onboard/[token]` | **bygges (Fase 2)** | Token-basert wizard — Tilganger, Innsikt, Veien videre |
| **Onboarding (intern)** | `/kunder/[slug]/onboarding` | **bygges (Fase 2)** | Lese kundens onboarding-svar |
| Kundeområde | `/kunde/[slug]` | live (statisk) | Kundens leveranseliste med status |
| Systemkonfig | `/admin` | live | Meta-konto-kobling, sync-status — strammes inn til kun systemkonfig |

### Konvensjon: hvor lever en modul?

- Modul = en flate kunden eller Simpleness bruker for én avgrenset oppgave
- Routing under `(intern)/` for Simpleness-flater, `(kunde)/` for kunde-flater
- Komponenter under `components/[modul-navn]/`
- Server actions / API under `app/api/[modul-navn]/`
- Database-tabeller med modul-prefix (`onboarding_*`, `clients`, `client_*`, `report_*`)

---

## Datamodell — Supabase-tabeller

Alle tabeller har RLS på, med policy `"service role full access"` som gir `service_role` full tilgang. Server-side kall bruker `service_role`-keyen. Stramme policies legges på i Fase 3 når auth kommer.

### Eksisterende (migrations 001–004)

| Tabell | Hva |
|---|---|
| `clients` | Én rad per kunde. PK: `id` (slug). Felter: `name`, `slug`, `meta_account_id`, `status` (KPI: green/yellow/red), `thresholds` (jsonb), `created_at`. 14 kunder seedet. |
| `meta_performance_daily` | Daglige Meta-metrikker per kampanje/adset |
| `meta_reach_weekly` | Ukentlig kumulativ + net new reach per kunde + kampanje |
| `meta_ads` | Ad-nivå metadata + livstidsmetrikker |
| `meta_ad_weekly` | Ukentlige ad-nivå insights for kohort-analyse |
| `notes` | Kommentarer per kunde / kampanje / ad |
| `report_snapshots` | Genererte rapporter med share_token |

### Nye (migrations 005+, pågår 2026-05-13)

**Utvidelse av `clients`:**
- `contact_name`, `contact_email` — kundens kontaktperson
- `simpleness_contact` — hvem hos oss eier denne kunden
- `lifecycle_stage` enum: `onboarding_ikke_startet | onboarding_steg_1 | onboarding_steg_2 | onboarding_steg_3 | onboarding_fullfort | aktiv | arkivert`
- `archived_at` timestamptz

NB: Eksisterende `status`-felt (KPI green/yellow/red) beholdes uendret. `lifecycle_stage` er separat — KPI vs onboarding-stage er ulike begreper.

**Ny tabell `client_leveranser`:**
- `client_id` FK → clients
- `slug`: 'onboarding' | 'tilstandsanalyse' | 'kreativ-brief' | 'budsjett' | 'kampanjeplan' | 'rapportering' | 'nyhetsbrev' | 'landingssider' | 'innholdsstrategi'
- `kategori`: 'performance' | 'prosjekter'
- `status`: 'godkjent' | 'til_avsjekk' | 'under_utvikling' (kundeområde-konvensjonen)
- `aktiv` boolean (false = ikke aktivert, vises grayed out)

Erstatter den statiske `lib/clients-leveranser.ts`-arrayen. Migrasjonen seeder fra Kokkeløren-fixturen.

**Onboarding-tabeller:**

| Tabell | Hva |
|---|---|
| `onboarding_sessions` | Token (URL-segment, unique), client_id FK, current_step (0-3), created_at, completed_at, last_active_at |
| `onboarding_access` | session_id FK + platform ('meta'/'ga4'/'google_ads'/'shopify'/'snapchat') + completed bool + completed_at + notes |
| `onboarding_insights` | session_id FK + alle Innsikt-feltene (16 stk fra mockup) |
| `onboarding_documents` | session_id FK + filename + storage_path + uploaded_at |

### Storage-bucket

- `onboarding-documents` (privat) — strategi-/brand-materiell fra Innsikt-uploaden

---

## Designsystem

- **Tokens:** Simpleness tokens.css (fra `simpleness-design-system.vercel.app`)
- **Farger:** `#FFFFFF` bg · `#090A08` tekst · `#89FF58` accent (sparsomt) · `#515B12` link/interactive
- **Font UI:** Plus Jakarta Sans (Google Fonts)
- **Font data:** IBM Plex Mono (alle tall/metrics)
- **Prinsipp:** Minst mulig farger — typografi og whitespace gjør jobben

---

## Neste steg

**Spor 1 — Kunder + Onboarding-modul (pågår, uavhengig av Meta-token):**
1. Migrations: `clients`, `client_leveranser`, `client_meta_accounts`, `onboarding_*`-tabellene + `onboarding-documents`-bucket
2. Bygg `(intern)/kunder/` — index, ny, [slug] (mockup: `Leveranser/Performance/Onboarding/mockup.html`)
3. Bygg `(kunde)/onboard/[token]/` — wizard med 3 steg
4. Migrer `lib/clients-leveranser.ts` til Supabase-queries
5. Token-generering + e-post-trigger ved opprettelse

**Spor 2 — Performance-data (venter på Meta-token):**
6. Bygg Meta API-klient (`lib/meta-api.ts`) med rolling reach-logikk
7. Bytt ut mock-data med Supabase-queries
8. Koble til System User Token og ad account IDs
9. Bygg Rapport-generator
10. Migrer Kokkeløren-prototype-innhold til `/kunde/kokkeloren`
