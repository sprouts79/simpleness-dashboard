-- 022_tilstandsanalyse_drop_mangler.sql
-- Konsolider 'feil' + 'mangler' → 'feil'. "Mangler tilgang" beholdes som egen status.

update public.tilstandsanalyse_responses set state = 'feil' where state = 'mangler';

alter table public.tilstandsanalyse_responses
  drop constraint tilstandsanalyse_responses_state_chk;

alter table public.tilstandsanalyse_responses
  add constraint tilstandsanalyse_responses_state_chk
    check (state is null or state in ('feil','na','wip','ok'));
