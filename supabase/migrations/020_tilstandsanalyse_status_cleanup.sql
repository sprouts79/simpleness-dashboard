-- 020_tilstandsanalyse_status_cleanup.sql
-- Status er nå Åpen (null) / Jobbes med / OK / Mangler tilgang.
-- p1/p2 fjernes som statuser — de er nå utelukkende item-prioriteter (Må ha / Anbefales).

update public.tilstandsanalyse_responses set state = null where state in ('p1','p2');

alter table public.tilstandsanalyse_responses
  drop constraint tilstandsanalyse_responses_state_chk;

alter table public.tilstandsanalyse_responses
  add constraint tilstandsanalyse_responses_state_chk
    check (state is null or state in ('na','wip','ok'));
