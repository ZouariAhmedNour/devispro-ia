-- =========================================================
-- Droits explicites (moindre privilège)
-- 1er verrou : GRANT (accès à la table) ; 2e verrou : RLS (accès aux lignes)
-- =========================================================

-- Les visiteurs non connectés n'ont accès à AUCUNE table métier
revoke all on public.companies, public.profiles, public.catalog_items,
              public.clients, public.quotes, public.quote_lines
  from anon;

-- Les utilisateurs connectés : uniquement ce dont l'app a besoin
grant usage on schema public to authenticated;

grant select, update
  on public.companies, public.profiles
  to authenticated;

grant select, insert, update, delete
  on public.catalog_items, public.clients, public.quotes, public.quote_lines
  to authenticated;

grant execute on function public.current_company_id() to authenticated;
grant execute on function public.quote_totals(uuid) to authenticated;