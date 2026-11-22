-- Le company_id est déduit de l'utilisateur connecté : le front n'a pas à l'envoyer.
alter table public.catalog_items alter column company_id set default public.current_company_id();
alter table public.clients       alter column company_id set default public.current_company_id();
alter table public.quotes        alter column company_id set default public.current_company_id();
alter table public.quote_lines   alter column company_id set default public.current_company_id();