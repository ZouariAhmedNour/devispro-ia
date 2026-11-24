-- Bucket privé pour les dictées (10 Mo max)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('audio', 'audio', false, 10485760,
        array['audio/webm', 'audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/ogg', 'audio/mpeg', 'audio/wav'])
on conflict (id) do nothing;

-- Chaque entreprise n'accède qu'à son dossier : audio/{company_id}/...
create policy "audio_insert_own_company" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'audio'
    and (storage.foldername(name))[1] = (select public.current_company_id())::text
  );

create policy "audio_select_own_company" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'audio'
    and (storage.foldername(name))[1] = (select public.current_company_id())::text
  );

create policy "audio_delete_own_company" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'audio'
    and (storage.foldername(name))[1] = (select public.current_company_id())::text
  );