-- ============================================================
-- Onboarding-modul — sessions, access, insights, documents
-- ============================================================
-- Token-basert webflyt per kunde. Token er unique URL-segment, ingen utløp.
-- Data er strukturert (ikke Drive-mappe). Se Leveranser/Performance/Onboarding/INSTRUKS.md.

-- ── onboarding_sessions ──────────────────────────────────────
create table public.onboarding_sessions (
  id              uuid primary key default gen_random_uuid(),
  token           text unique not null,                      -- URL-segment, kryptografisk generert
  client_id       text not null references public.clients(id) on delete cascade,
  current_step    int  not null default 0,                   -- 0=welcome, 1=tilganger, 2=innsikt, 3=veien-videre
  insights_locked boolean not null default false,            -- settes til true når kunde klikker "Send inn" på Steg 2
  created_at      timestamptz not null default now(),
  last_active_at  timestamptz not null default now(),
  completed_at    timestamptz
);

alter table public.onboarding_sessions enable row level security;
create policy "service role full access" on public.onboarding_sessions
  using (true) with check (true);

create index onboarding_sessions_client_id_idx on public.onboarding_sessions (client_id);
create index onboarding_sessions_token_idx     on public.onboarding_sessions (token);

-- ── onboarding_access ────────────────────────────────────────
-- Per-plattform fullført-status. 5 rader opprettes ved session-opprettelse.

create type onboarding_platform as enum (
  'meta',
  'ga4',
  'google_ads',
  'shopify',
  'snapchat'
);

create table public.onboarding_access (
  id            bigserial primary key,
  session_id    uuid not null references public.onboarding_sessions(id) on delete cascade,
  platform      onboarding_platform not null,
  required      boolean not null,                          -- meta/ga4/google_ads/shopify=true, snapchat=false
  completed     boolean not null default false,
  completed_at  timestamptz,
  notes         text,
  unique (session_id, platform)
);

alter table public.onboarding_access enable row level security;
create policy "service role full access" on public.onboarding_access
  using (true) with check (true);

create index onboarding_access_session_id_idx on public.onboarding_access (session_id);

-- ── onboarding_insights ──────────────────────────────────────
-- 16 felt fra mockup-Innsikt fordelt over 5 seksjoner.
-- Én rad per session.

create type insight_priority as enum (
  'topplinjevekst',
  'lonnsomhet',
  'begge'
);

create table public.onboarding_insights (
  id                            bigserial primary key,
  session_id                    uuid unique not null references public.onboarding_sessions(id) on delete cascade,

  -- Seksjon A: Forretning og mål
  forretningsmal                text,
  omsetningsmal                 text,                       -- fritekst (f.eks. "12 MNOK")
  prioritet                     insight_priority,
  utfordringer                  text,

  -- Seksjon B: Målgruppe og posisjonering
  malgruppe                     text,
  konkurrenter                  text,
  forbilder_ambassadorer        text,                       -- valgfritt — slått sammen
  -- (strategi-/brandmateriell ligger i onboarding_documents)

  -- Seksjon C: Produkt og pris
  prioriterte_produkter         text,
  snittordre_nok                int,
  sesongvariasjoner             text,
  rabatter_bundles              text,

  -- Seksjon D: Økonomi og nøkkeltall
  manedlig_annonsebudsjett_nok  int,
  kpis                          text[],                     -- ['ROAS','CAC','LTV','CTR','CPA','Bidragsmargin','Returrate']

  -- Seksjon E: Avslutning
  slack_medlemmer               text,
  suksess_definisjon            text,                       -- valgfritt
  noe_mer                       text,                       -- valgfritt

  submitted_at                  timestamptz,                -- settes når kunden klikker "Send inn"
  updated_at                    timestamptz not null default now()
);

alter table public.onboarding_insights enable row level security;
create policy "service role full access" on public.onboarding_insights
  using (true) with check (true);

create trigger onboarding_insights_updated_at
  before update on public.onboarding_insights
  for each row execute function set_updated_at();

-- ── onboarding_documents ─────────────────────────────────────
-- Filopplastinger til onboarding-documents storage-bucket.

create table public.onboarding_documents (
  id            bigserial primary key,
  session_id    uuid not null references public.onboarding_sessions(id) on delete cascade,
  filename      text not null,                              -- original-navn
  storage_path  text not null,                              -- path i bucket
  size_bytes    bigint,
  mime_type     text,
  uploaded_at   timestamptz not null default now()
);

alter table public.onboarding_documents enable row level security;
create policy "service role full access" on public.onboarding_documents
  using (true) with check (true);

create index onboarding_documents_session_id_idx on public.onboarding_documents (session_id);
