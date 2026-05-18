-- Legg til Google Tag Manager som onboarding-plattform.
-- Backfiller en GTM-tilgangsrad for alle eksisterende sessions så
-- innsendte data forblir uberørt mens nye sessions automatisk får raden.

alter type onboarding_platform add value if not exists 'gtm';

insert into onboarding_access (session_id, platform, required, completed)
select id, 'gtm'::onboarding_platform, true, false
from onboarding_sessions s
where not exists (
  select 1 from onboarding_access a
  where a.session_id = s.id and a.platform = 'gtm'
);
