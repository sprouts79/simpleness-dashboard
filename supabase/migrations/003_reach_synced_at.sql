-- Add synced_at to meta_reach_weekly to distinguish rows synced with the
-- current fixed-window algorithm from legacy sliding-window rows.
--
-- Old rows: synced_at IS NULL  → treated as empty / not shown
-- New rows: synced_at = NOW()  → shown in dashboard
--
-- Run once in Supabase SQL editor.

ALTER TABLE public.meta_reach_weekly
  ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ;
