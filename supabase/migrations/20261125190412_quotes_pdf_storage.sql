-- Bucket privé pour les PDF de devis (5 Mo max)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('quotes', 'quotes', false, 5242880, array['application/pdf'])
on conflict (id) do nothing;

-- Chaque entreprise n'accède qu'à son dossier : quotes/{company_id}/...
create policy "quotes_pdf_select_own_company" on storage.objects
  for select to authenticated
  using (bucket_id = 'quotes'
         and (storage.foldername(name))[1] = (select public.current_company_id())::text);

create policy "quotes_pdf_insert_own_company" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'quotes'
              and (storage.foldername(name))[1] = (select public.current_company_id())::text);

-- Régénérer un PDF remplace le fichier existant (upsert)
create policy "quotes_pdf_update_own_company" on storage.objects
  for update to authenticated
  using (bucket_id = 'quotes'
         and (storage.foldername(name))[1] = (select public.current_company_id())::text)
  with check (bucket_id = 'quotes'
              and (storage.foldername(name))[1] = (select public.current_company_id())::text);