-- ============================================================
-- Legg til 'avsjekk' i audit_item_state
-- ============================================================
-- Brukes når kunden har markert sin del som fullført — venter på avsjekk fra Simpleness.
-- Konsulent flytter videre til 'ok' når verifisert.

alter type audit_item_state add value if not exists 'avsjekk';
