-- 021_tilstandsanalyse_feil_mangler.sql
-- Legg til to røde statuser: 'feil' (noe er galt) og 'mangler' (noe er fraværende).

alter table public.tilstandsanalyse_responses
  drop constraint tilstandsanalyse_responses_state_chk;

alter table public.tilstandsanalyse_responses
  add constraint tilstandsanalyse_responses_state_chk
    check (state is null or state in ('feil','mangler','na','wip','ok'));
