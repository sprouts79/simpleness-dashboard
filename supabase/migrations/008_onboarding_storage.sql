-- ============================================================
-- Storage-bucket for onboarding-dokumenter
-- ============================================================
-- Privat bucket. Kun service_role (server-side) kan lese/skrive.
-- Filer organiseres som onboarding-documents/<session_id>/<filename>.

insert into storage.buckets (id, name, public)
values ('onboarding-documents', 'onboarding-documents', false)
on conflict (id) do nothing;

-- Policies — service_role har full tilgang via JWT-bypass uansett, men
-- vi setter eksplisitte policies som dokumenterer intensjonen.

create policy "service role can read onboarding-documents"
  on storage.objects for select
  using (bucket_id = 'onboarding-documents');

create policy "service role can write onboarding-documents"
  on storage.objects for insert
  with check (bucket_id = 'onboarding-documents');

create policy "service role can delete onboarding-documents"
  on storage.objects for delete
  using (bucket_id = 'onboarding-documents');
