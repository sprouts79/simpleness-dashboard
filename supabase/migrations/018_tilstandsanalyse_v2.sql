-- 018_tilstandsanalyse_v2.sql
-- Ny modell: binær checked-state per (client, kvartal, item).
-- Erstatter audit_states + audit_items. Gamle tabeller beholdes inntil videre
-- og kan dropps i en senere migrasjon.

create table public.tilstandsanalyse_config (
  client_id      text primary key references public.clients(id) on delete cascade,
  tracking_mode  text not null default 'shopify',  -- 'gtm' | 'shopify' | 'begge'
  snap_active    boolean not null default false,
  platform       text not null default 'shopify',  -- 'shopify' | 'centra' | 'woocommerce'
  updated_at     timestamptz not null default now()
);

alter table public.tilstandsanalyse_config enable row level security;
create policy "service role full access" on public.tilstandsanalyse_config
  using (true) with check (true);

create trigger tilstandsanalyse_config_updated_at
  before update on public.tilstandsanalyse_config
  for each row execute function set_updated_at();

create table public.tilstandsanalyse_responses (
  id          bigserial primary key,
  client_id   text not null references public.clients(id) on delete cascade,
  quarter     text not null,
  item_id     text not null,
  checked     boolean not null default false,
  updated_at  timestamptz not null default now(),
  unique (client_id, quarter, item_id)
);

alter table public.tilstandsanalyse_responses enable row level security;
create policy "service role full access" on public.tilstandsanalyse_responses
  using (true) with check (true);

create index tilstandsanalyse_responses_client_quarter_idx
  on public.tilstandsanalyse_responses (client_id, quarter);

create trigger tilstandsanalyse_responses_updated_at
  before update on public.tilstandsanalyse_responses
  for each row execute function set_updated_at();
