-- Insights: rename forbilder_ambassadorer → referanser_anti,
-- split ambassadører into own field.

alter table public.onboarding_insights
  rename column forbilder_ambassadorer to referanser_anti;

alter table public.onboarding_insights
  add column if not exists ambassadorer_kreatorer text;

-- Documents: allow link entries (no file in storage). Either storage_path
-- (file upload) or link_url (Google Doc / Sheet / Drive link) must be set.

alter table public.onboarding_documents
  alter column storage_path drop not null;

alter table public.onboarding_documents
  add column if not exists link_url text;

alter table public.onboarding_documents
  add constraint onboarding_documents_kind_chk
  check (
    (storage_path is not null and link_url is null) or
    (storage_path is null     and link_url is not null)
  );
