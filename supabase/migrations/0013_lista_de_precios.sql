-- =====================================================================
-- Actualizacion de precios desde la planilla del vivero.
--
-- Hasta ahora la lista se cargaba una vez con un script que escupia SQL:
-- cambiar un precio pedia un desarrollador. En un vivero la lista se
-- mueve todas las semanas, asi que eso es el problema, no un detalle.
--
-- Tres decisiones:
--   1. El mapeo de columnas es DATO (tenant_settings.price_import), no
--      constante: cada vivero manda su planilla con sus encabezados.
--   2. Se aplica en una sola llamada, y toca UNA sola columna: price.
--      Fotos, promos, atributos y descripciones son trabajo del vivero.
--   3. Queda registrada: cuando, quien, y fila por fila que precio
--      habia y cual quedo. Eso ya es el historial de precios.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Que columna de la planilla es cual, y donde corta los centavos.
-- Mismo criterio que theme: la app trae un default y la DB manda.
--   { "columns": { "sku": "Código", "price": "PRECIO PUBLICO" },
--     "rounding": "peso" }
-- ---------------------------------------------------------------------
alter table public.tenant_settings
  add column price_import jsonb not null default '{}'::jsonb;

comment on column public.tenant_settings.price_import is
  'Lectura de la lista de precios del vivero. columns: campo de la app -> ENCABEZADO de la planilla (guardamos el nombre, no la posicion, para que el orden de las columnas no importe). rounding: peso | centavo | decena | centena.';

-- ---------------------------------------------------------------------
-- Una importacion.
-- ---------------------------------------------------------------------
create table public.price_imports (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  filename     text,
  -- El mapeo con el que se leyo, congelado: dentro de un ano explica
  -- por que esta importacion entendio lo que entendio.
  mapping      jsonb not null default '{}'::jsonb,

  rows_total   integer not null default 0,
  rows_up      integer not null default 0,
  rows_down    integer not null default 0,
  rows_same    integer not null default 0,
  rows_skipped integer not null default 0,  -- la planilla no traia precio
  rows_new     integer not null default 0,  -- no estaban en el catalogo
  rows_absent  integer not null default 0,  -- estan en el catalogo y no vinieron
  rows_changed integer not null default 0,  -- precios efectivamente escritos
  rows_created integer not null default 0,  -- altas efectivamente creadas

  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index price_imports_tenant_idx on public.price_imports(tenant_id, created_at desc);

-- ---------------------------------------------------------------------
-- El detalle. Se guarda TODA la planilla, no solo lo que cambio: leido
-- al reves, esto dice que precio tenia cada planta en cada fecha.
--
-- product_id queda en null si despues borran la planta: el historial no
-- se rompe, y por eso tambien guardamos sku y nombre copiados.
-- ---------------------------------------------------------------------
create table public.price_import_items (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  import_id  uuid not null references public.price_imports(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,

  sku        text,
  slug       text,
  name       text,
  old_price  numeric(12,2),
  new_price  numeric(12,2),
  outcome    text not null
             check (outcome in ('sube','baja','igual','sin-precio','alta')),
  created_at timestamptz not null default now()
);
create index price_import_items_import_idx on public.price_import_items(import_id);
create index price_import_items_history_idx
  on public.price_import_items(tenant_id, product_id, created_at desc);

-- ---------------------------------------------------------------------
-- Aplicar: una sola llamada, una sola transaccion.
--
-- Sin security definer a proposito: corre con la sesion de la persona y
-- las policies de products la vuelven a validar. La membresia se chequea
-- igual para devolver un error entendible en lugar de "0 filas".
-- ---------------------------------------------------------------------
create or replace function public.apply_price_import(
  p_tenant     uuid,
  p_filename   text,
  p_mapping    jsonb,
  p_rows       jsonb,
  p_create_new boolean default false,
  p_absent     integer default 0
) returns jsonb
language plpgsql
set search_path = public as $fn$
declare
  v_import  uuid;
  v_changed integer := 0;
  v_created integer := 0;
begin
  if not public.is_member(p_tenant) then
    raise exception 'sin acceso a este vivero';
  end if;
  if jsonb_typeof(p_rows) is distinct from 'array' then
    raise exception 'la importacion llego sin filas';
  end if;
  if jsonb_array_length(p_rows) = 0 then
    raise exception 'la planilla no tiene ninguna fila para aplicar';
  end if;
  if jsonb_array_length(p_rows) > 20000 then
    raise exception 'la planilla es demasiado grande';
  end if;

  insert into public.price_imports
    (tenant_id, filename, mapping, rows_total, rows_absent, created_by)
  values
    (p_tenant,
     nullif(btrim(coalesce(p_filename, '')), ''),
     coalesce(p_mapping, '{}'::jsonb),
     jsonb_array_length(p_rows),
     greatest(coalesce(p_absent, 0), 0),
     auth.uid())
  returning id into v_import;

  -- old_price se lee AHORA, no el que vio la previsualizacion: si alguien
  -- toco el precio en el medio, el historial cuenta lo que de verdad paso.
  insert into public.price_import_items
    (tenant_id, import_id, product_id, sku, slug, name, old_price, new_price, outcome)
  select p_tenant, v_import, producto.id,
         nullif(btrim(coalesce(fila.sku, '')), ''),
         nullif(btrim(coalesce(fila.slug, '')), ''),
         nullif(btrim(coalesce(fila.name, '')), ''),
         producto.price, fila.price, fila.outcome
    from jsonb_to_recordset(p_rows) as fila(
           product_id uuid, sku text, slug text, name text, scientific text,
           envase text, category_slug text, price numeric, outcome text)
    left join public.products producto
      on producto.id = fila.product_id
     and producto.tenant_id = p_tenant;

  -- La unica escritura sobre el catalogo, y toca una sola columna.
  update public.products p
     set price = i.new_price
    from public.price_import_items i
   where i.import_id = v_import
     and i.product_id = p.id
     and p.tenant_id = p_tenant
     and i.outcome in ('sube', 'baja')
     and i.new_price is not null
     and p.price is distinct from i.new_price;
  get diagnostics v_changed = row_count;

  -- Las altas son opcionales y entran despublicadas: que las mire alguien
  -- antes de que aparezcan en el sitio.
  if coalesce(p_create_new, false) then
    insert into public.products
      (tenant_id, category_id, name, slug, scientific_name, sku, price, attributes, is_active)
    select p_tenant,
           (select c.id from public.categories c
             where c.tenant_id = p_tenant and c.slug = fila.category_slug),
           btrim(fila.name),
           btrim(fila.slug),
           nullif(btrim(coalesce(fila.scientific, '')), ''),
           nullif(btrim(coalesce(fila.sku, '')), ''),
           fila.price,
           case when coalesce(btrim(fila.envase), '') = '' then '{}'::jsonb
                else jsonb_build_object('envase', btrim(fila.envase)) end,
           false
      from jsonb_to_recordset(p_rows) as fila(
             product_id uuid, sku text, slug text, name text, scientific text,
             envase text, category_slug text, price numeric, outcome text)
     where fila.outcome = 'alta'
       and coalesce(btrim(fila.name), '') <> ''
       and coalesce(btrim(fila.slug), '') <> ''
    on conflict (tenant_id, slug) do nothing;
    get diagnostics v_created = row_count;
  end if;

  update public.price_imports
     set rows_up      = (select count(*) from public.price_import_items
                          where import_id = v_import and outcome = 'sube'),
         rows_down    = (select count(*) from public.price_import_items
                          where import_id = v_import and outcome = 'baja'),
         rows_same    = (select count(*) from public.price_import_items
                          where import_id = v_import and outcome = 'igual'),
         rows_skipped = (select count(*) from public.price_import_items
                          where import_id = v_import and outcome = 'sin-precio'),
         rows_new     = (select count(*) from public.price_import_items
                          where import_id = v_import and outcome = 'alta'),
         rows_changed = v_changed,
         rows_created = v_created
   where id = v_import;

  return jsonb_build_object('id', v_import, 'changed', v_changed, 'created', v_created);
end $fn$;

revoke all on function public.apply_price_import(uuid, text, jsonb, jsonb, boolean, integer) from public;
grant execute on function public.apply_price_import(uuid, text, jsonb, jsonb, boolean, integer)
  to authenticated;

-- ---------------------------------------------------------------------
-- RLS: la lista de precios es interna del vivero.
-- ---------------------------------------------------------------------
alter table public.price_imports      enable row level security;
alter table public.price_import_items enable row level security;

create policy price_imports_rw on public.price_imports for all
  using (public.is_member(tenant_id)) with check (public.is_member(tenant_id));

create policy price_import_items_rw on public.price_import_items for all
  using (public.is_member(tenant_id)) with check (public.is_member(tenant_id));
