-- ============================================================
-- client_leveranser — aktive leveranser per kunde
-- ============================================================
-- Erstatter den statiske `lib/clients-leveranser.ts`-arrayen.
-- En rad per (kunde × leveranse). Inaktive leveranser har aktiv=false
-- og vises grayed out i kundeområdet.

create type leveranse_status as enum (
  'godkjent',
  'til_avsjekk',
  'under_utvikling'
);

create type leveranse_kategori as enum (
  'performance',
  'prosjekter'
);

create table public.client_leveranser (
  id                bigserial primary key,
  client_id         text             not null references public.clients(id) on delete cascade,
  slug              text             not null,
  navn              text             not null,
  kategori          leveranse_kategori not null,
  status            leveranse_status not null default 'under_utvikling',
  aktiv             boolean          not null default true,
  kort_beskrivelse  text,
  parent_id         bigint           references public.client_leveranser(id) on delete cascade,
  created_at        timestamptz      not null default now(),
  updated_at        timestamptz      not null default now(),
  unique (client_id, slug)
);

alter table public.client_leveranser enable row level security;
create policy "service role full access" on public.client_leveranser
  using (true) with check (true);

create index client_leveranser_client_id_idx on public.client_leveranser (client_id);
create index client_leveranser_parent_id_idx on public.client_leveranser (parent_id);

-- Trigger: bump updated_at on update
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger client_leveranser_updated_at
  before update on public.client_leveranser
  for each row execute function set_updated_at();

-- ── Seed: Kokkeløren-leveransene fra lib/clients-leveranser.ts ─────
-- Resten av kundene får tomme leveranselister — populeres ved behov fra Kunder-admin.

insert into public.client_leveranser (client_id, slug, navn, kategori, status, aktiv, kort_beskrivelse) values
  ('kokkeloren', 'kreativ-brief',     'Kreativ Brief',     'performance', 'til_avsjekk',     true, 'Brand, designsystem og kreative retningslinjer'),
  ('kokkeloren', 'kampanjeplan',      'Kampanjeplan',      'performance', 'under_utvikling', true, 'Mediekjøp, plan og kampanjebriefer'),
  ('kokkeloren', 'innholdsstrategi',  'Innholdsstrategi',  'prosjekter',  'godkjent',        true, '17 landingssider — SEO + redaksjonelle'),
  ('kokkeloren', 'landingssider',     'Landingssider',     'prosjekter',  'under_utvikling', true, 'Design og wireframes for alle sider'),
  ('kokkeloren', 'nyhetsbrev',        'Nyhetsbrev',        'prosjekter',  'under_utvikling', true, 'Velkomstserie under produksjon')
on conflict (client_id, slug) do nothing;

-- Children av Kreativ Brief (Designsystem)
with parent as (
  select id from public.client_leveranser where client_id = 'kokkeloren' and slug = 'kreativ-brief'
)
insert into public.client_leveranser (client_id, slug, navn, kategori, status, aktiv, kort_beskrivelse, parent_id)
select 'kokkeloren', 'designsystem', 'Designsystem', 'performance', 'til_avsjekk', true, 'v1.0 — legacy bundle-format', parent.id
from parent
on conflict (client_id, slug) do nothing;

-- Children av Kampanjeplan (Augustkampanje 2026)
with parent as (
  select id from public.client_leveranser where client_id = 'kokkeloren' and slug = 'kampanjeplan'
)
insert into public.client_leveranser (client_id, slug, navn, kategori, status, aktiv, kort_beskrivelse, parent_id)
select 'kokkeloren', 'augustkampanje-2026', 'Augustkampanje 2026', 'performance', 'under_utvikling', true, 'Brief klar', parent.id
from parent
on conflict (client_id, slug) do nothing;
