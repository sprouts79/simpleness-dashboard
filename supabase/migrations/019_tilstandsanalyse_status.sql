-- 019_tilstandsanalyse_status.sql
-- Bytt binær checked → fullt statussystem (null/na/p1/p2/wip/ok)
-- + notat + assignee per sjekkpunkt. Erstatter v2-modellen som så vidt gikk live.

alter table public.tilstandsanalyse_responses
  drop column checked,
  add column state    text,
  add column note     text,
  add column assignee text;

-- Sjekk-constraint i stedet for enum (enklere å iterere)
alter table public.tilstandsanalyse_responses
  add constraint tilstandsanalyse_responses_state_chk
    check (state is null or state in ('na','p1','p2','wip','ok')),
  add constraint tilstandsanalyse_responses_assignee_chk
    check (assignee is null or assignee in ('kunde'));
