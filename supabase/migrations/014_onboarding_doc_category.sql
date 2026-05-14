-- Onboarding-dokumenter: kategori (strategy = brand-/strategi-materiell,
-- budget = salgsbudsjetter etc). Default 'strategy' for backward compat.

alter table public.onboarding_documents
  add column if not exists category text not null default 'strategy';
