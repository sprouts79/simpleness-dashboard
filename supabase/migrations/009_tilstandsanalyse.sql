-- ============================================================
-- Tilstandsanalyse — audit_states + audit_items
-- ============================================================
-- Per kunde × kvartal lagrer vi en versjon av tilstandsanalysen.
-- Versjonsverdiene følger SOP-en i Leveranser/Performance/Tilstandsanalyse/INSTRUKS.md:
--   draft        — ny kjøring (eller manuell start), ikke vist til kunde
--   under_review — konsulent har åpnet og begynt å justere
--   godkjent     — synlig for kunde. Kun én godkjent per kunde til enhver tid.
--   arkivert     — tidligere godkjente versjoner (historikk)

create type audit_versjon as enum (
  'draft',
  'under_review',
  'godkjent',
  'arkivert'
);

-- En verdi for hvert sjekkpunkt: åpen (null), mangler tilgang, prio 1, prio 2,
-- jobbes med, eller ok. Speiler s-na/s-p1/s-p2/s-wip/s-ok i mockupen.
create type audit_item_state as enum (
  'na',     -- mangler tilgang
  'p1',     -- prio 1 (kritisk)
  'p2',     -- prio 2 (bør forbedres)
  'wip',    -- jobbes med
  'ok'      -- på plass og fungerer
);

-- ── audit_states ────────────────────────────────────────────
create table public.audit_states (
  id              uuid primary key default gen_random_uuid(),
  client_id       text not null references public.clients(id) on delete cascade,
  versjon         audit_versjon not null,
  kvartal         text not null,                              -- '2026-Q2', '2026-Q3' …
  godkjent_av     text,
  godkjent_dato   timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.audit_states enable row level security;
create policy "service role full access" on public.audit_states
  using (true) with check (true);

-- Maks én draft + maks én godkjent per kunde til enhver tid.
create unique index audit_states_one_draft_per_client
  on public.audit_states (client_id) where versjon = 'draft';
create unique index audit_states_one_godkjent_per_client
  on public.audit_states (client_id) where versjon = 'godkjent';

create index audit_states_client_id_idx on public.audit_states (client_id);
create index audit_states_versjon_idx   on public.audit_states (versjon);

create trigger audit_states_updated_at
  before update on public.audit_states
  for each row execute function set_updated_at();

-- ── audit_items ─────────────────────────────────────────────
-- Én rad per (state × sjekkpunkt-id). 45 rader per state ved full populasjon,
-- men runneren / admin oppretter rader on-demand.

create table public.audit_items (
  id            bigserial primary key,
  state_id      uuid not null references public.audit_states(id) on delete cascade,
  item_id       text not null,                                -- 's01', 'p05', 'f17', …
  state         audit_item_state,                             -- null = "Åpen"
  note          text,
  assignee      text,                                         -- null | 'kunde'
  auto          boolean not null default false,               -- true når satt av runner
  evidence      jsonb,                                        -- intern — vises ikke til kunde
  updated_at    timestamptz not null default now(),
  unique (state_id, item_id)
);

alter table public.audit_items enable row level security;
create policy "service role full access" on public.audit_items
  using (true) with check (true);

create index audit_items_state_id_idx on public.audit_items (state_id);

create trigger audit_items_updated_at
  before update on public.audit_items
  for each row execute function set_updated_at();
