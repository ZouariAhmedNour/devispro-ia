begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

-- =====================================================
-- Données de test (en tant que postgres : RLS ignorée)
-- =====================================================
insert into auth.users (id, email) values
  ('a1a1a1a1-0000-0000-0000-000000000001', 'alice@a.test'),
  ('b2b2b2b2-0000-0000-0000-000000000001', 'bob@b.test');

insert into public.companies (id, name) values
  ('a1a1a1a1-0000-0000-0000-00000000000a', 'Entreprise A'),
  ('b2b2b2b2-0000-0000-0000-00000000000b', 'Entreprise B');

insert into public.profiles (id, company_id) values
  ('a1a1a1a1-0000-0000-0000-000000000001', 'a1a1a1a1-0000-0000-0000-00000000000a'),
  ('b2b2b2b2-0000-0000-0000-000000000001', 'b2b2b2b2-0000-0000-0000-00000000000b');

insert into public.catalog_items (id, company_id, label, unit, unit_price_cents) values
  ('a1a1a1a1-0000-0000-0000-0000000000c1', 'a1a1a1a1-0000-0000-0000-00000000000a', 'Pose carrelage', 'm²', 3500),
  ('b2b2b2b2-0000-0000-0000-0000000000c1', 'b2b2b2b2-0000-0000-0000-00000000000b', 'Peinture murale', 'm²', 2200);

insert into public.clients (id, company_id, name) values
  ('a1a1a1a1-0000-0000-0000-0000000000d1', 'a1a1a1a1-0000-0000-0000-00000000000a', 'Client de A'),
  ('b2b2b2b2-0000-0000-0000-0000000000d1', 'b2b2b2b2-0000-0000-0000-00000000000b', 'Client de B');

insert into public.quotes (id, company_id, client_id, notes, created_by) values
  ('a1a1a1a1-0000-0000-0000-0000000000e1', 'a1a1a1a1-0000-0000-0000-00000000000a',
   'a1a1a1a1-0000-0000-0000-0000000000d1', 'devis A', 'a1a1a1a1-0000-0000-0000-000000000001'),
  ('b2b2b2b2-0000-0000-0000-0000000000e1', 'b2b2b2b2-0000-0000-0000-00000000000b',
   'b2b2b2b2-0000-0000-0000-0000000000d1', 'devis B', 'b2b2b2b2-0000-0000-0000-000000000001');

-- =====================================================
-- On devient Alice (entreprise A)
-- =====================================================
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"a1a1a1a1-0000-0000-0000-000000000001","role":"authenticated"}', true);

-- 1
select results_eq(
  $$ select name from public.companies $$,
  $$ values ('Entreprise A'::text) $$,
  'Alice ne voit que son entreprise');

-- 2
select results_eq(
  $$ select label from public.catalog_items $$,
  $$ values ('Pose carrelage'::text) $$,
  'Alice ne voit que son catalogue');

-- 3
select is_empty(
  $$ select id from public.quotes where company_id = 'b2b2b2b2-0000-0000-0000-00000000000b' $$,
  'Alice ne voit aucun devis de B');

-- 4
select is(
  (select count(*) from public.quotes)::int, 1,
  'Alice voit exactement 1 devis');

-- 5
select throws_ok(
  $$ insert into public.clients (company_id, name)
     values ('b2b2b2b2-0000-0000-0000-00000000000b', 'Intrus') $$,
  '42501', null,
  'Alice ne peut pas créer de client dans l''entreprise B');

-- 6
select throws_ok(
  $$ insert into public.quotes (company_id, client_id)
     values ('a1a1a1a1-0000-0000-0000-00000000000a', 'b2b2b2b2-0000-0000-0000-0000000000d1') $$,
  '23503', null,
  'Alice ne peut pas rattacher un client de B à son devis');

-- 7
select throws_ok(
  $$ select public.create_company('Deuxième entreprise') $$,
  'P0001', null,
  'Un utilisateur ne peut créer qu''une seule entreprise');

-- Alice tente de modifier puis de supprimer le devis de B
update public.quotes set notes = 'piraté' where id = 'b2b2b2b2-0000-0000-0000-0000000000e1';
delete from public.quotes where id = 'b2b2b2b2-0000-0000-0000-0000000000e1';

-- =====================================================
-- Vérification en tant qu'administrateur
-- =====================================================
reset role;

-- 8
select is(
  (select notes from public.quotes where id = 'b2b2b2b2-0000-0000-0000-0000000000e1'),
  'devis B',
  'Le devis de B n''a été ni modifié ni supprimé par Alice');

-- =====================================================
-- Visiteur non connecté
-- =====================================================
set local role anon;
select set_config('request.jwt.claims', '', true);

-- 9
select is_empty(
  $$ select id from public.quotes $$,
  'Un visiteur non connecté ne voit aucun devis');

-- =====================================================
-- On devient Bob (entreprise B) : symétrie
-- =====================================================
reset role;
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"b2b2b2b2-0000-0000-0000-000000000001","role":"authenticated"}', true);

-- 10
select results_eq(
  $$ select notes from public.quotes $$,
  $$ values ('devis B'::text) $$,
  'Bob ne voit que le devis de B');

select * from finish();
rollback;