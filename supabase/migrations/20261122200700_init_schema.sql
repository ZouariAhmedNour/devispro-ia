-- =========================================================
-- DevisPro IA : schéma initial + Row Level Security
-- =========================================================

-- ---------- Tables ----------

create table public.companies (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  siret            text,
  address          text,
  created_at       timestamptz not null default now()
);

-- Lien utilisateur (auth.users) <-> entreprise
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  company_id  uuid not null references public.companies(id) on delete cascade,
  full_name   text,
  created_at  timestamptz not null default now()
);

create table public.catalog_items (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid not null references public.companies(id) on delete cascade,
  label             text not null,
  unit              text not null,                       -- m², h, u, forfait
  unit_price_cents  integer not null check (unit_price_cents >= 0),
  vat_rate          numeric(4,2) not null default 20 check (vat_rate in (5.5, 10, 20)),
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  unique (id, company_id)
);

create table public.clients (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  name        text not null,
  email       text,
  phone       text,
  address     text,
  created_at  timestamptz not null default now(),
  unique (id, company_id)
);

create type public.quote_status as enum ('draft', 'sent', 'accepted', 'rejected');

create table public.quotes (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  client_id   uuid,
  status      public.quote_status not null default 'draft',
  notes       text,
  created_by  uuid references auth.users(id) default auth.uid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (id, company_id),
  -- le client doit appartenir à la MÊME entreprise
  foreign key (client_id, company_id)
    references public.clients(id, company_id) on delete set null (client_id)
);

create table public.quote_lines (
  id                uuid primary key default gen_random_uuid(),
  quote_id          uuid not null,
  company_id        uuid not null,
  catalog_item_id   uuid,
  -- copie figée au moment du devis (le catalogue peut changer ensuite)
  label             text not null,
  unit              text not null,
  quantity          numeric(10,2) not null check (quantity > 0),
  unit_price_cents  integer not null check (unit_price_cents >= 0),
  vat_rate          numeric(4,2) not null check (vat_rate in (5.5, 10, 20)),
  position          integer not null default 0,
  foreign key (quote_id, company_id)
    references public.quotes(id, company_id) on delete cascade,
  foreign key (catalog_item_id, company_id)
    references public.catalog_items(id, company_id) on delete set null (catalog_item_id)
);

-- ---------- Fonction utilitaire ----------
-- Renvoie l'entreprise de l'utilisateur connecté.
-- security definer : évite la récursion avec la RLS de profiles.
create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select company_id from public.profiles where id = auth.uid()
$$;

-- ---------- Onboarding : créer son entreprise ----------
create or replace function public.create_company(p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Non authentifié';
  end if;
  if exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'Cet utilisateur a déjà une entreprise';
  end if;

  insert into public.companies (name) values (p_name) returning id into v_company_id;
  insert into public.profiles (id, company_id) values (auth.uid(), v_company_id);
  return v_company_id;
end;
$$;

revoke execute on function public.create_company(text) from public, anon;
grant execute on function public.create_company(text) to authenticated;

-- ---------- Row Level Security ----------
alter table public.companies     enable row level security;
alter table public.profiles      enable row level security;
alter table public.catalog_items enable row level security;
alter table public.clients       enable row level security;
alter table public.quotes        enable row level security;
alter table public.quote_lines   enable row level security;

-- companies : lire / modifier uniquement la sienne (création via create_company)
create policy "company_select_own" on public.companies
  for select to authenticated
  using (id = (select public.current_company_id()));

create policy "company_update_own" on public.companies
  for update to authenticated
  using (id = (select public.current_company_id()))
  with check (id = (select public.current_company_id()));

-- profiles : voir les collègues de son entreprise, modifier seulement son profil
create policy "profiles_select_same_company" on public.profiles
  for select to authenticated
  using (company_id = (select public.current_company_id()));

create policy "profiles_update_self" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and company_id = (select public.current_company_id()));

-- tables métier : tout, mais uniquement sur son company_id
create policy "catalog_items_company" on public.catalog_items
  for all to authenticated
  using (company_id = (select public.current_company_id()))
  with check (company_id = (select public.current_company_id()));

create policy "clients_company" on public.clients
  for all to authenticated
  using (company_id = (select public.current_company_id()))
  with check (company_id = (select public.current_company_id()));

create policy "quotes_company" on public.quotes
  for all to authenticated
  using (company_id = (select public.current_company_id()))
  with check (company_id = (select public.current_company_id()));

create policy "quote_lines_company" on public.quote_lines
  for all to authenticated
  using (company_id = (select public.current_company_id()))
  with check (company_id = (select public.current_company_id()));