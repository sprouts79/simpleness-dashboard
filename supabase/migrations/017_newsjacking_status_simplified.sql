-- Forenkle status til 3 verdier: foreslatt | godkjent | avvist.
-- Drop 'passert' og 'levert' — vil ikke spores i pilot.

alter table public.newsjacking_drops
  drop constraint newsjacking_drops_status_check;

alter table public.newsjacking_drops
  add constraint newsjacking_drops_status_check
  check (status in ('foreslatt', 'godkjent', 'avvist'));
