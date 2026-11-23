-- =========================================================
-- Données de démo (local uniquement)
-- Comptes : artisan.a@demo.test / demo1234
--           artisan.b@demo.test / demo1234
-- =========================================================

-- ---------- Utilisateurs Auth ----------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000001',
   'authenticated', 'authenticated', 'artisan.a@demo.test',
   extensions.crypt('demo1234', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'bbbbbbbb-0000-0000-0000-000000000001',
   'authenticated', 'authenticated', 'artisan.b@demo.test',
   extensions.crypt('demo1234', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

insert into auth.identities (id, user_id, provider_id, identity_data, provider,
                             last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       'email', now(), now(), now()
from auth.users u
where u.email in ('artisan.a@demo.test', 'artisan.b@demo.test');

-- ---------- Entreprises + profils ----------
insert into public.companies (id, name, siret, address) values
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'Martin Carrelage', '12345678900011', '12 rue des Artisans, 69003 Lyon'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'Dubois Peinture',  '98765432100022', '5 avenue Jean Jaurès, 31000 Toulouse');

insert into public.profiles (id, company_id, full_name) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-00000000000a', 'Paul Martin'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-00000000000b', 'Julie Dubois');

-- ---------- Catalogues ----------
insert into public.catalog_items (company_id, label, unit, unit_price_cents, vat_rate) values
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'Pose carrelage sol',         'm²',      3500, 10),
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'Pose faïence murale',        'm²',      4200, 10),
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'Dépose ancien carrelage',    'm²',      1500, 10),
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'Ragréage sol',               'm²',      1800, 10),
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'Déplacement',                'forfait', 4000, 20),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'Peinture murale 2 couches',  'm²',      2200, 10),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'Peinture plafond',           'm²',      2600, 10),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'Enduit de rebouchage',       'm²',       900, 10),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'Protection du chantier',     'forfait', 6000, 20);

-- ---------- Clients ----------
insert into public.clients (id, company_id, name, email, address) values
  ('aaaaaaaa-0000-0000-0000-0000000000d1', 'aaaaaaaa-0000-0000-0000-00000000000a',
   'Mme Durand', 'durand@client.test', '8 place Bellecour, 69002 Lyon'),
  ('aaaaaaaa-0000-0000-0000-0000000000d2', 'aaaaaaaa-0000-0000-0000-00000000000a',
   'M. Leroy', 'leroy@client.test', '22 cours Gambetta, 69007 Lyon'),
  ('bbbbbbbb-0000-0000-0000-0000000000d1', 'bbbbbbbb-0000-0000-0000-00000000000b',
   'SCI Les Tilleuls', 'contact@tilleuls.test', '3 allée des Tilleuls, 31400 Toulouse');

-- ---------- Un devis brouillon pour A ----------
insert into public.quotes (id, company_id, client_id, notes, created_by) values
  ('aaaaaaaa-0000-0000-0000-0000000000e1', 'aaaaaaaa-0000-0000-0000-00000000000a',
   'aaaaaaaa-0000-0000-0000-0000000000d1', 'Salle de bain, 12 m² au sol',
   'aaaaaaaa-0000-0000-0000-000000000001');

insert into public.quote_lines (quote_id, company_id, catalog_item_id, label, unit,
                                quantity, unit_price_cents, vat_rate, position)
select 'aaaaaaaa-0000-0000-0000-0000000000e1', ci.company_id, ci.id, ci.label, ci.unit,
       q.qty, ci.unit_price_cents, ci.vat_rate, q.pos
from public.catalog_items ci
join (values ('Dépose ancien carrelage', 12.00, 1),
             ('Pose carrelage sol',      12.00, 2),
             ('Déplacement',              1.00, 3)) as q(label, qty, pos)
  on q.label = ci.label
where ci.company_id = 'aaaaaaaa-0000-0000-0000-00000000000a';

-- ---------- Totaux calculés par le serveur ----------
update public.quotes q
   set (total_ht_cents, total_vat_cents, total_ttc_cents) =
       (select t.total_ht_cents, t.total_vat_cents, t.total_ttc_cents
          from public.quote_totals(q.id) as t);