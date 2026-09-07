-- =====================================================================
-- La consulta del sitio es un mensaje, no una lista.
--
-- El cliente escribe lo que necesita con sus palabras. El vivero lee la
-- consulta y arma el presupuesto con la calculadora del panel, que es
-- donde vive el precio.
--
-- p_items queda por compatibilidad pero ya no se usa desde el sitio:
-- una consulta puede entrar sin ningun item.
-- =====================================================================

create or replace function public.submit_quote_request(
  p_tenant  uuid,
  p_name    text,
  p_phone   text,
  p_email   text,
  p_message text,
  p_items   jsonb default '[]'::jsonb
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

  if p_message is null or btrim(p_message) = '' then
    raise exception 'contanos que necesitas';
  end if;

  v_count := jsonb_array_length(coalesce(p_items, '[]'::jsonb));
  if v_count > 50 then
    raise exception 'demasiadas plantas en una sola consulta';
  end if;

  -- Freno de spam: como maximo 20 consultas por hora por vivero.
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
    -- Numero provisorio: el correlativo se asigna cuando el vivero la
    -- convierte en presupuesto, para no gastar numeracion con consultas
    -- que nunca se cotizan.
    -(extract(epoch from now())::bigint % 1000000000),
    'solicitud', 'sitio',
    left(btrim(p_name), 120),
    left(btrim(p_phone), 60),
    nullif(left(btrim(coalesce(p_email, '')), 160), ''),
    left(btrim(p_message), 2000),
    0, 0, 15
  )
  returning id into v_quote;

  -- Solo si alguien igual manda items (no lo hace el sitio hoy).
  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
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
