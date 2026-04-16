-- Fix meta_reach_weekly unique constraint.
-- The original constraint included campaign_id (nullable) and lookback_days,
-- but synced rows are at account level (no campaign_id) with lookback_days=90.
-- Replace with a simpler constraint that matches the upsert key.

alter table public.meta_reach_weekly
  drop constraint if exists meta_reach_weekly_client_id_week_start_campaign_id_lookback_days_key;

alter table public.meta_reach_weekly
  add constraint meta_reach_weekly_client_id_week_start_lookback_days_key
  unique (client_id, week_start, lookback_days);
