-- ============================================================
-- Extend clients with lifecycle/contact fields for Kunder-modul
-- ============================================================
-- KPI-status (green/yellow/red) and lifecycle_stage are separate concepts:
--   status           = ad-konto-helse (KPI thresholds)
--   lifecycle_stage  = hvor i kunde-livssyklusen vi er

create type client_lifecycle_stage as enum (
  'onboarding_ikke_startet',
  'onboarding_steg_1',
  'onboarding_steg_2',
  'onboarding_steg_3',
  'onboarding_fullfort',
  'aktiv',
  'arkivert'
);

alter table public.clients
  add column if not exists contact_name        text,
  add column if not exists contact_email       text,
  add column if not exists simpleness_contact  text,
  add column if not exists lifecycle_stage     client_lifecycle_stage not null default 'aktiv',
  add column if not exists archived_at         timestamptz;

-- Existing 14 kunder er allerede aktive (eller burde antas aktive) — defaulten 'aktiv' dekker dem.
-- Når Onboarding-modulen oppretter nye kunder, settes lifecycle_stage eksplisitt til
-- 'onboarding_ikke_startet' og oppdateres etter hvert som kunden progresserer.

create index if not exists clients_lifecycle_stage_idx on public.clients (lifecycle_stage);
