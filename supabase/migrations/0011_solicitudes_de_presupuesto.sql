-- =====================================================================
-- Solicitudes de presupuesto desde el sitio.
--
-- El cliente elige plantas y cantidades; NO ve ni fija precios. La
-- solicitud entra como borrador con los importes en cero y reciben un
-- numero recien cuando una persona la cotiza en el panel.
--
-- El anonimo NO tiene insert sobre quotes: entra por una funcion que
-- valida todo (tenant activo, productos del tenant, cantidades, tope
-- por hora) y decide ella los valores sensibles.
-- =====================================================================

alter table public.quotes
  drop constraint quotes_status_check;

alter table public.quotes
  add constraint quotes_status_check
  check (status in ('solicitud','borrador','enviado','aceptado','rechazado','vencido'));

alter table public.quotes
  add column source text not null default 'panel'
      check (source in ('panel','sitio')),
  add column customer_message text;

comment on column public.quotes.source is
  'panel = lo armo el vivero. sitio = lo pidio un cliente y todavia no tiene precios.';

create index quotes_pendientes_idx
  on public.quotes(tenant_id, created_at desc)
  where status = 'solicitud';

-- ---------------------------------------------------------------------
-- Alta de una solicitud desde el sitio publico.
--
-- Devuelve solo el id: el cliente no recibe totales ni el numero
-- correlativo, porque todavia no hay nada cotizado.
-- ---------------------------------------------------------------------
create or replace function public.submit_quote_request(
  p_tenant  uuid,
  p_name    text,
  p_phone   text,
  p_email   text,
  p_message text,
  p_items   jsonb
) returns uuid
language plpgsql security definer set search_path = public as $fn$
declare
  v_quote   uuid;
  v_count   integer;
  v_recent  integer;
  v_item    jsonb;
  v_product record;
  v_qty     numeric;
  v_pos     integer := 0;
begin
  if not exists (select 1 from public.tenants where id = p_tenant and status = 'active') then
    raise exception 'vivero no disponible';
  end if;

  if p_name is null or btrim(p_name) = '' then
    raise exception 'falta el nombre';
  end if;

  if p_phone is null or btrim(p_phone) = '' then
    raise exception 'falta un telefono de contacto';
  end if;

  v_count := jsonb_array_length(coalesce(p_items, '[]'::jsonb));
  if v_count = 0 then
    raise exception 'la lista esta vacia';
  end if;
  if v_count > 50 then
    raise exception 'demasiadas plantas en una sola consulta';
  end if;

  -- Freno de spam: como maximo 20 solicitudes por hora por vivero.
  select count(*) into v_recent
    from public.quotes
   where tenant_id = p_tenant
     and source = 'sitio'
     and created_at > now() - interval '1 hour';
  if v_recent >= 20 then
    raise exception 'recibimos muchas consultas juntas, probá en unos minutos';
  end if;

  insert into public.quotes (
    tenant_id, number, status, source,
    customer_name, customer_phone, customer_email, customer_message,
    discount_pct, payment_adjust_pct, valid_days
  )
  values (
    p_tenant,
    -- Numero provisorio negativo: el correlativo se asigna cuando el
    -- vivero la convierte en presupuesto, para no gastar numeracion
    -- con consultas que nunca se cotizan.
    -(extract(epoch from now())::bigint % 1000000000),
    'solicitud', 'sitio',
    left(btrim(p_name), 120),
    left(btrim(p_phone), 60),
    nullif(left(btrim(coalesce(p_email, '')), 160), ''),
    nullif(left(btrim(coalesce(p_message, '')), 1000), ''),
    0, 0, 15
  )
  returning id into v_quote;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := coalesce((v_item->>'qty')::numeric, 0);
    if v_qty <= 0 or v_qty > 9999 then
      raise exception 'cantidad invalida';
    end if;

    select p.id, p.name, p.scientific_name, p.attributes
      into v_product
      from public.products p
     where p.id = (v_item->>'product_id')::uuid
       and p.tenant_id = p_tenant
       and p.is_active;

    if not found then
      raise exception 'una de las plantas ya no esta disponible';
    end if;

    v_pos := v_pos + 1;

    -- unit_price en cero a proposito: el precio lo pone el vivero.
    insert into public.quote_items
      (tenant_id, quote_id, product_id, name, detail, unit_price, qty, position)
    values (
      p_tenant, v_quote, v_product.id, v_product.name,
      nullif(concat_ws(' · ', v_product.scientific_name, v_product.attributes->>'envase'), ''),
      0, v_qty, v_pos
    );
  end loop;

  return v_quote;
end $fn$;

revoke all on function public.submit_quote_request(uuid, text, text, text, text, jsonb) from public;
grant execute on function public.submit_quote_request(uuid, text, text, text, text, jsonb)
  to anon, authenticated;

-- ---------------------------------------------------------------------
-- Al cotizarla, recien ahi toma numero correlativo.
-- ---------------------------------------------------------------------
create or replace function public.promote_quote_request(p_quote uuid)
returns integer
language plpgsql security definer set search_path = public as $fn$
declare v_tenant uuid; v_number integer;
begin
  select tenant_id into v_tenant from public.quotes where id = p_quote;
  if v_tenant is null then
    raise exception 'presupuesto inexistente';
  end if;
  if not public.is_member(v_tenant) then
    raise exception 'sin acceso a este vivero';
  end if;

  select coalesce(max(number), 0) + 1 into v_number
    from public.quotes where tenant_id = v_tenant and number > 0;

  update public.quotes
     set number = v_number, status = 'borrador'
   where id = p_quote and number < 0;

  return v_number;
end $fn$;

grant execute on function public.promote_quote_request(uuid) to authenticated;
