begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

-- ---------- Données (UUID dédiés : c3c3c3c3-...) ----------
insert into auth.users (id, email) values
  ('c3c3c3c3-0000-0000-0000-000000000001', 'carla@c.test');
insert into public.companies (id, name) values
  ('c3c3c3c3-0000-0000-0000-00000000000c', 'Entreprise C');
insert into public.profiles (id, company_id) values
  ('c3c3c3c3-0000-0000-0000-000000000001', 'c3c3c3c3-0000-0000-0000-00000000000c');

insert into public.quotes (id, company_id) values
  ('c3c3c3c3-0000-0000-0000-0000000000e1', 'c3c3c3c3-0000-0000-0000-00000000000c'),
  ('c3c3c3c3-0000-0000-0000-0000000000e2', 'c3c3c3c3-0000-0000-0000-00000000000c'),
  ('c3c3c3c3-0000-0000-0000-0000000000e3', 'c3c3c3c3-0000-0000-0000-00000000000c');

-- Devis 1 : identique au test Vitest « devis de démo »
insert into public.quote_lines (quote_id, company_id, label, unit, quantity, unit_price_cents, vat_rate) values
  ('c3c3c3c3-0000-0000-0000-0000000000e1', 'c3c3c3c3-0000-0000-0000-00000000000c', 'Dépose',      'm²',      12, 1500, 10),
  ('c3c3c3c3-0000-0000-0000-0000000000e1', 'c3c3c3c3-0000-0000-0000-00000000000c', 'Pose',        'm²',      12, 3500, 10),
  ('c3c3c3c3-0000-0000-0000-0000000000e1', 'c3c3c3c3-0000-0000-0000-00000000000c', 'Déplacement', 'forfait',  1, 4000, 20);

-- Devis 2 : 3 lignes à 0,05 €, TVA 10 % (test « TVA par taux »)
insert into public.quote_lines (quote_id, company_id, label, unit, quantity, unit_price_cents, vat_rate) values
  ('c3c3c3c3-0000-0000-0000-0000000000e2', 'c3c3c3c3-0000-0000-0000-00000000000c', 'A', 'u', 1, 5, 10),
  ('c3c3c3c3-0000-0000-0000-0000000000e2', 'c3c3c3c3-0000-0000-0000-00000000000c', 'B', 'u', 1, 5, 10),
  ('c3c3c3c3-0000-0000-0000-0000000000e2', 'c3c3c3c3-0000-0000-0000-00000000000c', 'C', 'u', 1, 5, 10);

-- Devis 3 : 3 × 3,33 € avec 15 % de remise (test « arrondi après remise »)
insert into public.quote_lines (quote_id, company_id, label, unit, quantity, unit_price_cents, vat_rate, discount_percent) values
  ('c3c3c3c3-0000-0000-0000-0000000000e3', 'c3c3c3c3-0000-0000-0000-00000000000c', 'Remise', 'u', 3, 333, 20, 15);

-- ---------- Mêmes résultats que Vitest ----------
-- 1
select results_eq(
  $$ select * from public.quote_totals('c3c3c3c3-0000-0000-0000-0000000000e1') $$,
  $$ values (64000, 6800, 70800) $$,
  'SQL = Vitest : devis de démo (HT 640 €, TVA 68 €, TTC 708 €)');

-- 2
select is(
  (select total_vat_cents from public.quote_totals('c3c3c3c3-0000-0000-0000-0000000000e2')),
  2,
  'SQL = Vitest : TVA calculée par taux (2 centimes, pas 3)');

-- 3
select is(
  (select total_ht_cents from public.quote_totals('c3c3c3c3-0000-0000-0000-0000000000e3')),
  849,
  'SQL = Vitest : arrondi après remise (8,49 €)');

-- ---------- save_quote vérifie les totaux ----------
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"c3c3c3c3-0000-0000-0000-000000000001","role":"authenticated"}', true);

-- 4 : 10 × 35 € = 350 € HT + 35 € TVA = 385 € TTC
select lives_ok(
  $$ select public.save_quote(
       'c3c3c3c3-0000-0000-0000-0000000000e1', 'draft',
       '[{"catalog_item_id":null,"label":"Pose","unit":"m²","quantity":10,"unit_price_cents":3500,"vat_rate":10,"discount_percent":0}]'::jsonb,
       38500) $$,
  'save_quote accepte des totaux cohérents');

-- 5 : on envoie 20 m² mais on prétend que le TTC vaut toujours 385 €
select throws_ok(
  $$ select public.save_quote(
       'c3c3c3c3-0000-0000-0000-0000000000e1', 'draft',
       '[{"catalog_item_id":null,"label":"Pose","unit":"m²","quantity":20,"unit_price_cents":3500,"vat_rate":10,"discount_percent":0}]'::jsonb,
       38500) $$,
  'P0001', null,
  'save_quote refuse des totaux incohérents');

reset role;

-- 6 : le rejet a tout annulé, le devis est resté à 385 €
select is(
  (select total_ttc_cents from public.quotes where id = 'c3c3c3c3-0000-0000-0000-0000000000e1'),
  38500,
  'Le rejet a annulé tout l''enregistrement');

select * from finish();
rollback;