-- Remise en % par ligne (utilisée par computeQuoteTotals)
alter table public.quote_lines
  add column discount_percent numeric(5,2) not null default 0
  check (discount_percent >= 0 and discount_percent <= 100);

-- Enregistre un devis et TOUTES ses lignes en une seule transaction.
-- security invoker : la fonction s'exécute avec les droits de l'utilisateur,
-- donc la RLS s'applique (impossible d'enregistrer le devis d'une autre entreprise).
create or replace function public.save_quote(
  p_quote_id  uuid,
  p_status    public.quote_status,
  p_lines     jsonb,
  p_client_id uuid default null,
  p_notes     text default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
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
end;
$$;

revoke execute on function public.save_quote(uuid, public.quote_status, jsonb, uuid, text) from public, anon;
grant execute on function public.save_quote(uuid, public.quote_status, jsonb, uuid, text) to authenticated;