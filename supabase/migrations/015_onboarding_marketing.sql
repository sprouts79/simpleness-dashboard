-- Onboarding-innsikt: marketing-detaljer (epost/SMS-lister, automatisering,
-- markedshistorikk).

alter table public.onboarding_insights
  add column if not exists nyhetsbrev_liste_antall              int,
  add column if not exists sms_liste_antall                     int,
  add column if not exists nyhetsbrev_frekvens                  text,
  add column if not exists automatiske_eposter_aktivert         boolean,
  add column if not exists automatiske_eposter_typer            text[],
  add column if not exists marketingsaktiviteter_fungerte       text,
  add column if not exists marketingsaktiviteter_ikke_fungerte  text;
