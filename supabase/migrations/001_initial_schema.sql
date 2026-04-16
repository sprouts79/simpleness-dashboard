-- ============================================================
-- Simpleness Dashboard — Initial Schema
-- ============================================================

-- ── clients ─────────────────────────────────────────────────
create table public.clients (
  id            text primary key,              -- slug: 'myyk', 'kokkeloren'
  name          text not null,
  slug          text not null unique,
  meta_account_id text,                        -- act_XXXXX
  status        text not null default 'green'  -- green | yellow | red
                check (status in ('green','yellow','red')),
  thresholds    jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

alter table public.clients enable row level security;
create policy "service role full access" on public.clients
  using (true) with check (true);

-- ── meta_performance_daily ───────────────────────────────────
create table public.meta_performance_daily (
  id            bigserial primary key,
  client_id     text not null references public.clients(id) on delete cascade,
  date          date not null,
  campaign_id   text,
  campaign_name text,
  adset_id      text,
  adset_name    text,
  spend         numeric(12,2) not null default 0,
  impressions   bigint not null default 0,
  reach         bigint not null default 0,
  frequency     numeric(6,2),
  clicks        bigint not null default 0,
  purchases     integer not null default 0,
  purchase_value numeric(12,2) not null default 0,
  cpm           numeric(10,2),
  ctr           numeric(6,4),
  cpa           numeric(10,2),
  roas          numeric(8,4),
  created_at    timestamptz not null default now(),
  unique (client_id, date, campaign_id, adset_id)
);

alter table public.meta_performance_daily enable row level security;
create policy "service role full access" on public.meta_performance_daily
  using (true) with check (true);

create index on public.meta_performance_daily (client_id, date desc);

-- ── meta_reach_weekly ────────────────────────────────────────
create table public.meta_reach_weekly (
  id                    bigserial primary key,
  client_id             text not null references public.clients(id) on delete cascade,
  week_start            date not null,
  campaign_id           text,
  campaign_name         text,
  -- cumulative reach from account start to week_start + 7d
  cumulative_reach      bigint not null default 0,
  -- reach within this week only
  weekly_reach          bigint not null default 0,
  -- derived: cumulative[n] - cumulative[n-1]
  net_new_reach         bigint not null default 0,
  -- net_new / weekly * 100
  pct_net_new           numeric(6,2),
  spend                 numeric(12,2) not null default 0,
  impressions           bigint not null default 0,
  frequency             numeric(6,2),
  cpm                   numeric(10,2),
  cpm_net_new           numeric(10,2),
  lookback_days         integer not null default 180,
  created_at            timestamptz not null default now(),
  unique (client_id, week_start, campaign_id, lookback_days)
);

alter table public.meta_reach_weekly enable row level security;
create policy "service role full access" on public.meta_reach_weekly
  using (true) with check (true);

create index on public.meta_reach_weekly (client_id, week_start desc);

-- ── meta_ads ─────────────────────────────────────────────────
create table public.meta_ads (
  ad_id         text not null,
  client_id     text not null references public.clients(id) on delete cascade,
  ad_name       text not null,
  adset_id      text,
  campaign_id   text,
  created_date  date,
  cohort_date   date,               -- same as created_date, grouped by day
  format        text check (format in ('video','static','carousel','story')),
  thumbnail_url text,
  status        text check (status in ('active','paused','learning','archived')),
  naming_tags   jsonb default '{}'::jsonb,
  -- lifetime metrics (refreshed periodically)
  spend         numeric(12,2) default 0,
  impressions   bigint default 0,
  reach         bigint default 0,
  clicks        bigint default 0,
  purchases     integer default 0,
  purchase_value numeric(12,2) default 0,
  video_views_3s bigint default 0,
  video_views_thruplays bigint default 0,
  hook_rate     numeric(6,2),       -- video_views_3s / impressions * 100
  hold_rate     numeric(6,2),       -- thruplays / impressions * 100
  ctr           numeric(6,4),
  cpm           numeric(10,2),
  cpa           numeric(10,2),
  roas          numeric(8,4),
  refreshed_at  timestamptz,
  created_at    timestamptz not null default now(),
  primary key (ad_id, client_id)
);

alter table public.meta_ads enable row level security;
create policy "service role full access" on public.meta_ads
  using (true) with check (true);

create index on public.meta_ads (client_id, cohort_date desc);

-- ── notes ────────────────────────────────────────────────────
create table public.notes (
  id            bigserial primary key,
  client_id     text not null references public.clients(id) on delete cascade,
  author        text,               -- e.g. 'jonas@simpleness.no'
  entity_type   text,               -- 'campaign' | 'cohort' | 'ad' | 'general'
  entity_id     text,               -- campaign_id or ad_id
  content       text not null,
  created_at    timestamptz not null default now()
);

alter table public.notes enable row level security;
create policy "service role full access" on public.notes
  using (true) with check (true);

-- ── report_snapshots ─────────────────────────────────────────
create table public.report_snapshots (
  id            bigserial primary key,
  client_id     text not null references public.clients(id) on delete cascade,
  period_start  date not null,
  period_end    date not null,
  generated_by  text,
  content       jsonb not null default '{}'::jsonb,
  share_token   text unique default gen_random_uuid()::text,
  expires_at    timestamptz,
  created_at    timestamptz not null default now()
);

alter table public.report_snapshots enable row level security;
create policy "service role full access" on public.report_snapshots
  using (true) with check (true);

-- ── seed: clients ────────────────────────────────────────────
insert into public.clients (id, name, slug, meta_account_id, status, thresholds) values
  ('myyk',       'MYYK',       'myyk',       'act_431404084344569', 'yellow',
    '{"roas_min":3.5,"cpa_max":250,"frequency_max":8,"net_new_pct_min":20}'::jsonb),
  ('kokkeloren', 'Kokkeløren', 'kokkeloren', null,                  'green',
    '{"roas_min":4.5,"cpa_max":180,"frequency_max":6,"net_new_pct_min":25}'::jsonb),
  ('farfar',     'Far-Far',    'farfar',     null,                  'red',
    '{"roas_min":3.0,"cpa_max":280,"frequency_max":8,"net_new_pct_min":20}'::jsonb)
on conflict (id) do update set
  meta_account_id = excluded.meta_account_id,
  thresholds = excluded.thresholds;
