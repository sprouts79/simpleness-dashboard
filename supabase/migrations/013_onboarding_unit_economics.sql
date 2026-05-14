-- Onboarding-innsikt: salgsmål + enhetsøkonomi (speiler dashboard-kalkulatoren)
-- Alle tall ekskl. mva. Kun input — vi beregner ikke nøkkeltall her.

alter table public.onboarding_insights
  add column if not exists salgsmal_fjoraret_nok      bigint,
  add column if not exists salgsmal_vekstmal_pct      numeric(6,2),
  add column if not exists salgsmal_iar_nok           bigint,
  add column if not exists omsetning_forste_ordre_nok int,
  add column if not exists omsetning_6mnd_nok         int,
  add column if not exists omsetning_12mnd_nok        int,
  add column if not exists andel_nye_kunder_pct       numeric(6,2),
  add column if not exists varekost_pct               numeric(6,2),
  add column if not exists frakt_pct                  numeric(6,2),
  add column if not exists transaksjonsgebyr_pct      numeric(6,2),
  add column if not exists mkt_spend_arlig_nok        bigint,
  add column if not exists mkt_produksjon_arlig_nok   bigint;
