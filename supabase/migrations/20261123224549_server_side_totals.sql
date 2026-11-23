-- =========================================================
-- Totaux calculés et vérifiés côté serveur
-- Mêmes règles que packages/shared/src/quote-calc.ts :
--   ligne HT = arrondi(arrondi(qté × prix) × (100 - remise) / 100)
--   TVA      = arrondi(total HT du taux × taux / 100), PAR TAUX
-- =========================================================

-- Totaux stockés sur le devis (source de vérité : le serveur)
alter table public.quotes
  add column total_ht_cents  integer not null default 0,
  add column total_vat_cents integer not null default 0,
  add column total_ttc_cents integer not null default 0;

-- Calcul des totaux d'un devis
create or replace function public.quote_totals(p_quote_id uuid)
returns table (total_ht_cents integer, total_vat_cents integer, total_ttc_cents integer)
language sql
stable
security invoker
set search_path = ''
as $$
  with lines as (
    select vat_rate,
           round(round(quantity * unit_price_cents) * (100 - discount_percent) / 100) as ht
    from public.quote_lines
    where quote_id = p_quote_id
  ),
  by_rate as (
    select sum(ht) as base,
           round(sum(ht) * vat_rate / 100) as vat
    from lines
    group by vat_rate
  )
  select coalesce(sum(base), 0)::integer,
         coalesce(sum(vat), 0)::integer,
         (coalesce(sum(base), 0) + coalesce(sum(vat), 0))::integer
  from by_rate;
$$;

-- save_quote reçoit désormais le TTC affiché par le navigateur
drop function public.save_quote(uuid, public.quote_status, jsonb, uuid, text);

create function public.save_quote(
  p_quote_id           uuid,
  p_status             public.quote_status,
  p_lines              jsonb,
  p_expected_ttc_cents integer,
  p_client_id          uuid default null,
  p_notes              text default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_ht  integer;
  v_vat integer;
  v_ttc integer;
begin
  update public.quotes
     set client_id  = p_client_id,
         notes      = p_notes,
         status     = p_status,
         updated_at = now()
   where id = p_quote_id;

  if not found then
    raise exception 'Devis introuvable' using errcode = 'P0002';
  end if;

  delete from public.quote_lines where quote_id = p_quote_id;

  insert into public.quote_lines (
    quote_id, catalog_item_id, label, unit, quantity,
    unit_price_cents, vat_rate, discount_percent, position
  )
  select p_quote_id,
         (l ->> 'catalog_item_id')::uuid,
         l ->> 'label',
         l ->> 'unit',
         (l ->> 'quantity')::numeric,
         (l ->> 'unit_price_cents')::integer,
         (l ->> 'vat_rate')::numeric,
         coalesce((l ->> 'discount_percent')::numeric, 0),
         (ord - 1)::integer
  from jsonb_array_elements(p_lines) with ordinality as t(l, ord);

  -- Recalcul serveur
  select t.total_ht_cents, t.total_vat_cents, t.total_ttc_cents
    into v_ht, v_vat, v_ttc
    from public.quote_totals(p_quote_id) as t;

  -- Vérification : le navigateur et le serveur doivent être d'accord au centime près.
  -- Une exception annule TOUTE la transaction (lignes comprises).
  if v_ttc <> p_expected_ttc_cents then
    raise exception 'Totaux incohérents : serveur % centimes, navigateur % centimes',
      v_ttc, p_expected_ttc_cents
      using errcode = 'P0001';
  end if;

  update public.quotes
     set total_ht_cents  = v_ht,
         total_vat_cents = v_vat,
         total_ttc_cents = v_ttc
   where id = p_quote_id;
end;
$$;

revoke execute on function public.save_quote(uuid, public.quote_status, jsonb, integer, uuid, text) from public, anon;
grant execute on function public.save_quote(uuid, public.quote_status, jsonb, integer, uuid, text) to authenticated;