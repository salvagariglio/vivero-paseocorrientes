-- =====================================================================
-- El aislamiento del catalogo pasa a Postgres.
--
-- Las policies de lectura publica que habia (`is_active or is_member`)
-- no filtraban por tenant: un anonimo podia leer los productos activos
-- de TODOS los viveros con una sola llamada. Con un solo vivero no se
-- nota; con el segundo es la lista de precios de la competencia.
--
-- No era un olvido: un visitante anonimo no tiene forma de declarar a
-- que vivero pertenece, asi que la policy no tiene con que filtrar. La
-- salida es la misma que ya usa resolve_tenant: funciones que RECIBEN
-- el tenant y son el unico camino de lectura publica.
--
-- Esta migracion solo AGREGA las funciones. El acceso directo se corta
-- en la 0016, despues de verificar que el sitio anda contra estas.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Categorias publicas del vivero
-- ---------------------------------------------------------------------
create or replace function public.public_categories(p_tenant uuid)
returns table (
  id uuid, parent_id uuid, name text, slug citext, description text,
  image_url text, icon text, "position" integer, is_active boolean
)
language sql stable security definer set search_path = public as $fn$
  select c.id, c.parent_id, c.name, c.slug, c.description,
         c.image_url, c.icon, c.position, c.is_active
    from public.categories c
    join public.tenants t on t.id = c.tenant_id
   where c.tenant_id = p_tenant
     and c.is_active
     and t.status = 'active'
   order by c.position, c.name;
$fn$;

-- ---------------------------------------------------------------------
-- Productos publicados. Un solo lugar para todas las variantes de
-- consulta del sitio: por rama de categoria, destacados y busqueda.
-- ---------------------------------------------------------------------
create or replace function public.public_products(
  p_tenant       uuid,
  p_category_ids uuid[] default null,
  p_featured     boolean default false,
  p_search       text default null,
  p_limit        integer default 500
)
returns table (
  id uuid, name text, slug citext, scientific_name text,
  short_description text, description text,
  price numeric, promo_price numeric, promo_label text,
  promo_starts_at timestamptz, promo_ends_at timestamptz,
  sku text, stock integer, image_url text, attributes jsonb,
  is_active boolean, is_featured boolean, "position" integer, category_id uuid
)
language sql stable security definer set search_path = public as $fn$
  select p.id, p.name, p.slug, p.scientific_name,
         p.short_description, p.description,
         p.price, p.promo_price, p.promo_label,
         p.promo_starts_at, p.promo_ends_at,
         p.sku, p.stock, p.image_url, p.attributes,
         p.is_active, p.is_featured, p.position, p.category_id
    from public.products p
    join public.tenants t on t.id = p.tenant_id
   where p.tenant_id = p_tenant
     and p.is_active
     and t.status = 'active'
     and (p_category_ids is null or p.category_id = any(p_category_ids))
     and (not p_featured or p.is_featured)
     and (
       p_search is null or btrim(p_search) = ''
       or p.name ilike '%' || btrim(p_search) || '%'
       or p.scientific_name ilike '%' || btrim(p_search) || '%'
       or p.short_description ilike '%' || btrim(p_search) || '%'
     )
   order by p.position, p.name
   limit greatest(1, least(coalesce(p_limit, 500), 1000));
$fn$;

-- ---------------------------------------------------------------------
-- Una planta, con su galeria. Las imagenes salen de aca y no de una
-- tabla abierta: antes product_images era legible con `true`, o sea que
-- exponia fotos de productos todavia despublicados.
-- ---------------------------------------------------------------------
create or replace function public.public_product(p_tenant uuid, p_slug text)
returns jsonb
language sql stable security definer set search_path = public as $fn$
  select to_jsonb(x) from (
    select p.id, p.name, p.slug, p.scientific_name,
           p.short_description, p.description,
           p.price, p.promo_price, p.promo_label,
           p.promo_starts_at, p.promo_ends_at,
           p.sku, p.stock, p.image_url, p.attributes,
           p.is_active, p.is_featured, p.position, p.category_id,
           coalesce(
             (select jsonb_agg(jsonb_build_object('id', i.id, 'url', i.url, 'alt', i.alt)
                        order by i.position)
                from public.product_images i
               where i.product_id = p.id),
             '[]'::jsonb
           ) as images
      from public.products p
      join public.tenants t on t.id = p.tenant_id
     where p.tenant_id = p_tenant
       and p.slug = p_slug
       and p.is_active
       and t.status = 'active'
     limit 1
  ) x;
$fn$;

create or replace function public.public_category(p_tenant uuid, p_slug text)
returns table (
  id uuid, parent_id uuid, name text, slug citext,
  description text, image_url text, icon text
)
language sql stable security definer set search_path = public as $fn$
  select c.id, c.parent_id, c.name, c.slug, c.description, c.image_url, c.icon
    from public.categories c
    join public.tenants t on t.id = c.tenant_id
   where c.tenant_id = p_tenant
     and c.slug = p_slug
     and c.is_active
     and t.status = 'active'
   limit 1;
$fn$;

create or replace function public.public_attribute_definitions(p_tenant uuid)
returns table (
  id uuid, key citext, label text, help text, kind text,
  options jsonb, "position" integer, show_on_label boolean, show_on_card boolean
)
language sql stable security definer set search_path = public as $fn$
  select d.id, d.key, d.label, d.help, d.kind,
         d.options, d.position, d.show_on_label, d.show_on_card
    from public.attribute_definitions d
   where d.tenant_id = p_tenant
     and d.is_active
   order by d.position;
$fn$;

-- Conteo por categoria: antes se traian los 448 category_id al server
-- solo para contarlos.
create or replace function public.public_category_counts(p_tenant uuid)
returns table (category_id uuid, total bigint)
language sql stable security definer set search_path = public as $fn$
  select p.category_id, count(*)
    from public.products p
   where p.tenant_id = p_tenant
     and p.is_active
     and p.category_id is not null
   group by p.category_id;
$fn$;

-- ---------------------------------------------------------------------
-- Solo el sitio publico las ejecuta; nadie mas necesita estas.
-- ---------------------------------------------------------------------
do $blk$
declare f text;
begin
  foreach f in array array[
    'public_categories(uuid)',
    'public_products(uuid, uuid[], boolean, text, integer)',
    'public_product(uuid, text)',
    'public_category(uuid, text)',
    'public_attribute_definitions(uuid)',
    'public_category_counts(uuid)'
  ] loop
    execute format('revoke all on function public.%s from public', f);
    execute format('grant execute on function public.%s to anon, authenticated', f);
  end loop;
end $blk$;
