-- Weekly ad-level insights for cohort analysis.
-- Rows are keyed by (ad_id, week_start) — one row per ad per 7-day period.
-- Synced via syncType="cohort" with time_increment=7 at ad level from Meta.
--
-- Run once in Supabase SQL editor.

CREATE TABLE IF NOT EXISTS public.meta_ad_weekly (
  id                       bigserial PRIMARY KEY,
  ad_id                    text        NOT NULL,
  client_id                text        NOT NULL,
  week_start               date        NOT NULL,
  spend                    numeric     DEFAULT 0,
  impressions              bigint      DEFAULT 0,
  clicks                   bigint      DEFAULT 0,
  purchases                numeric     DEFAULT 0,
  purchase_value           numeric     DEFAULT 0,
  video_views_3s           bigint      DEFAULT 0,
  video_views_thruplays    bigint      DEFAULT 0,
  hook_rate                numeric,
  hold_rate                numeric,
  ctr                      numeric,
  cpm                      numeric,
  cpa                      numeric,
  roas                     numeric,
  synced_at                timestamptz DEFAULT now(),
  UNIQUE (ad_id, week_start)
);

CREATE INDEX IF NOT EXISTS meta_ad_weekly_client_week
  ON public.meta_ad_weekly (client_id, week_start);
