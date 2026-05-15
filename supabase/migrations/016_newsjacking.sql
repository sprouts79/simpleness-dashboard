-- ============================================================
-- Newsjacking — drops + scans
-- ============================================================
-- For Grandiosa-piloten. Hver "drop" er en idé agenten foreslår.
-- Hver "scan" er en daglig kjøring (for dager med 0 ideer også).
--
-- Status-konvensjon:
--   foreslatt — agenten har postet, venter respons
--   godkjent  — 👍 fra Grandiosa, klar for produksjon
--   avvist    — 👎 fra Grandiosa
--   passert   — ingen respons innen arbeidsdag (iht brief)
--   levert    — uttak ferdig produsert og levert

create table public.newsjacking_drops (
  id              uuid primary key default gen_random_uuid(),
  kunde_slug      text not null,
  dato            date not null,
  ukedag          text not null,
  tittel          text not null,
  beskrivelse     text not null,
  du_vinkling     text not null,
  sources         jsonb not null default '[]'::jsonb,
  status          text not null default 'foreslatt',
  slack_channel   text,
  slack_message_ts text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint newsjacking_drops_status_check
    check (status in ('foreslatt', 'godkjent', 'avvist', 'passert', 'levert'))
);

alter table public.newsjacking_drops enable row level security;
create policy "service role full access" on public.newsjacking_drops
  using (true) with check (true);

create index newsjacking_drops_kunde_dato_idx
  on public.newsjacking_drops (kunde_slug, dato desc, created_at desc);
create index newsjacking_drops_status_idx
  on public.newsjacking_drops (status);

create trigger newsjacking_drops_updated_at
  before update on public.newsjacking_drops
  for each row execute function set_updated_at();

-- Én rad per (kunde, dato) — for "tidligere"-listen, inkl. dager med 0 ideer.
create table public.newsjacking_scans (
  id                 uuid primary key default gen_random_uuid(),
  kunde_slug         text not null,
  dato               date not null,
  ukedag             text not null,
  saker_scannet      int not null default 0,
  saker_etter_filter int not null default 0,
  ideer_postet       int not null default 0,
  notater            text,
  created_at         timestamptz not null default now(),
  unique (kunde_slug, dato)
);

alter table public.newsjacking_scans enable row level security;
create policy "service role full access" on public.newsjacking_scans
  using (true) with check (true);

create index newsjacking_scans_kunde_dato_idx
  on public.newsjacking_scans (kunde_slug, dato desc);
