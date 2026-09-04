-- =====================================================================
-- Vivero SaaS — schema multitenant
-- Todo dato de negocio cuelga de un tenant. Nada hardcodeado en la app.
-- =====================================================================

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ---------------------------------------------------------------------
-- Tenants
-- ---------------------------------------------------------------------
create table public.tenants (
  id          uuid primary key default gen_random_uuid(),
  slug        citext not null unique,
  name        text   not null,
  status      text   not null default 'active' check (status in ('active','suspended')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Hosts que resuelven a un tenant: subdominio propio y/o dominio del cliente.
create table public.tenant_domains (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  host        citext not null unique,
  is_primary  boolean not null default false,
  created_at  timestamptz not null default now()
);
create index tenant_domains_tenant_idx on public.tenant_domains(tenant_id);
create unique index tenant_domains_one_primary
  on public.tenant_domains(tenant_id) where is_primary;

-- Branding + configuracion. Reemplaza cualquier constante de marca.
create table public.tenant_settings (
  tenant_id      uuid primary key references public.tenants(id) on delete cascade,
  logo_url       text,
  favicon_url    text,
  cover_url      text,
  tagline        text,
  about          text,
  brand_primary  text not null default '#1e5540',
  brand_accent   text not null default '#7a1f3d',
  brand_surface  text not null default '#eef1e9',
  currency       text not null default 'ARS',
  locale         text not null default 'es-AR',
  show_prices    boolean not null default true,
  whatsapp       text,
  instagram      text,
  email          text,
  phone          text,
  address        text,
  maps_url       text,
  opening_hours  text,
  extra          jsonb not null default '{}'::jsonb,
  updated_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Membresias / roles
-- ---------------------------------------------------------------------
create type public.member_role as enum ('owner','admin','editor');

create table public.memberships (
  user_id     uuid not null references auth.users(id) on delete cascade,
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  role        public.member_role not null default 'editor',
  created_at  timestamptz not null default now(),
  primary key (user_id, tenant_id)
);
create index memberships_tenant_idx on public.memberships(tenant_id);

-- Invitaciones por email para usuarios que todavia no existen en auth.users
create table public.tenant_invites (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  email       citext not null,
  role        public.member_role not null default 'editor',
  invited_by  uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  created_at  timestamptz not null default now(),
  unique (tenant_id, email)
);

-- ---------------------------------------------------------------------
-- Catalogo
-- ---------------------------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  parent_id   uuid references public.categories(id) on delete cascade,
  name        text not null,
  slug        citext not null,
  description text,
  image_url   text,
  position    integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (tenant_id, slug)
);
create index categories_tenant_parent_idx on public.categories(tenant_id, parent_id, position);

create table public.products (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  category_id       uuid references public.categories(id) on delete set null,
  name              text not null,
  slug              citext not null,
  scientific_name   text,
  short_description text,
  description       text,
  price             numeric(12,2),
  promo_price       numeric(12,2),
  promo_label       text,
  promo_starts_at   timestamptz,
  promo_ends_at     timestamptz,
  sku               text,
  stock             integer,
  image_url         text,
  -- Atributos libres (luz, riego, tamano de maceta, dificultad...).
  -- Escalable sin migracion: la UI los renderiza dinamicamente.
  attributes        jsonb not null default '{}'::jsonb,
  is_active         boolean not null default true,
  is_featured       boolean not null default false,
  position          integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (tenant_id, slug)
);
create index products_tenant_cat_idx on public.products(tenant_id, category_id, position);
create index products_tenant_active_idx on public.products(tenant_id, is_active);

create table public.product_images (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  url         text not null,
  alt         text,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);
create index product_images_product_idx on public.product_images(product_id, position);

-- Plantillas de etiqueta: medidas y que se imprime. Sin presets hardcodeados.
create table public.label_templates (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  name          text not null,
  width_mm      numeric(6,2) not null default 50,
  height_mm     numeric(6,2) not null default 80,
  qr_mm         numeric(6,2) not null default 22,
  page_size     text not null default 'A4' check (page_size in ('A4','Letter')),
  gap_mm        numeric(6,2) not null default 4,
  margin_mm     numeric(6,2) not null default 8,
  show_logo     boolean not null default true,
  show_price    boolean not null default true,
  show_description boolean not null default true,
  show_scientific  boolean not null default true,
  is_default    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create unique index label_templates_one_default
  on public.label_templates(tenant_id) where is_default;

-- ---------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $fn$
begin
  new.updated_at = now();
  return new;
end $fn$;

do $blk$
declare t text;
begin
  foreach t in array array['tenants','tenant_settings','categories','products','label_templates'] loop
    execute format(
      'create trigger %I_touch before update on public.%I
         for each row execute function public.touch_updated_at()', t, t);
  end loop;
end $blk$;

-- ---------------------------------------------------------------------
-- Helpers de autorizacion
-- security definer => no disparan RLS => sin recursion en las policies
-- ---------------------------------------------------------------------
create or replace function public.is_member(p_tenant uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (
    select 1 from public.memberships m
    where m.tenant_id = p_tenant and m.user_id = auth.uid()
  );
$fn$;

create or replace function public.has_role(p_tenant uuid, p_roles public.member_role[])
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (
    select 1 from public.memberships m
    where m.tenant_id = p_tenant and m.user_id = auth.uid() and m.role = any(p_roles)
  );
$fn$;

-- Tenants del usuario actual (selector del panel)
create or replace function public.my_tenants()
returns table (id uuid, slug citext, name text, role public.member_role)
language sql stable security definer set search_path = public as $fn$
  select t.id, t.slug, t.name, m.role
  from public.memberships m
  join public.tenants t on t.id = m.tenant_id
  where m.user_id = auth.uid()
  order by t.name;
$fn$;

-- Alta de vivero: tenant + settings + dominio + etiqueta default + owner.
create or replace function public.create_tenant(
  p_slug text,
  p_name text,
  p_root_domain text default null
) returns uuid
language plpgsql security definer set search_path = public as $fn$
declare v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'no autenticado';
  end if;

  insert into public.tenants (slug, name) values (lower(p_slug), p_name)
  returning id into v_id;

  insert into public.memberships (user_id, tenant_id, role)
  values (auth.uid(), v_id, 'owner');

  insert into public.tenant_settings (tenant_id) values (v_id);

  insert into public.label_templates (tenant_id, name, is_default)
  values (v_id, 'Etiqueta estandar', true);

  if p_root_domain is not null then
    insert into public.tenant_domains (tenant_id, host, is_primary)
    values (v_id, lower(p_slug) || '.' || lower(p_root_domain), true);
  end if;

  return v_id;
end $fn$;

-- Resolucion host -> tenant. Se llama sin sesion desde el sitio publico.
create or replace function public.resolve_tenant(p_host text)
returns table (
  id uuid, slug citext, name text, status text, host citext, settings jsonb
)
language sql stable security definer set search_path = public as $fn$
  select t.id, t.slug, t.name, t.status, d.host,
         coalesce(to_jsonb(s.*) - 'tenant_id', '{}'::jsonb) as settings
  from public.tenant_domains d
  join public.tenants t on t.id = d.tenant_id
  left join public.tenant_settings s on s.tenant_id = t.id
  where d.host = lower(p_host) and t.status = 'active'
  limit 1;
$fn$;

-- Igual pero por slug (dev local / fallback)
create or replace function public.resolve_tenant_by_slug(p_slug text)
returns table (
  id uuid, slug citext, name text, status text, host citext, settings jsonb
)
language sql stable security definer set search_path = public as $fn$
  select t.id, t.slug, t.name, t.status,
         (select d.host from public.tenant_domains d
           where d.tenant_id = t.id order by d.is_primary desc limit 1) as host,
         coalesce(to_jsonb(s.*) - 'tenant_id', '{}'::jsonb) as settings
  from public.tenants t
  left join public.tenant_settings s on s.tenant_id = t.id
  where t.slug = lower(p_slug) and t.status = 'active'
  limit 1;
$fn$;

-- Acepta invitaciones pendientes del email del usuario logueado.
create or replace function public.claim_invites()
returns integer language plpgsql security definer set search_path = public as $fn$
declare v_email citext; v_count integer := 0;
begin
  select u.email into v_email from auth.users u where u.id = auth.uid();
  if v_email is null then return 0; end if;

  with claimed as (
    update public.tenant_invites i
       set accepted_at = now()
     where i.email = v_email and i.accepted_at is null
     returning i.tenant_id, i.role
  ), ins as (
    insert into public.memberships (user_id, tenant_id, role)
    select auth.uid(), c.tenant_id, c.role from claimed c
    on conflict (user_id, tenant_id) do nothing
    returning 1
  )
  select count(*) into v_count from ins;
  return v_count;
end $fn$;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.tenants          enable row level security;
alter table public.tenant_domains   enable row level security;
alter table public.tenant_settings  enable row level security;
alter table public.memberships      enable row level security;
alter table public.tenant_invites   enable row level security;
alter table public.categories       enable row level security;
alter table public.products         enable row level security;
alter table public.product_images   enable row level security;
alter table public.label_templates  enable row level security;

-- tenants
create policy tenants_read_active on public.tenants
  for select using (status = 'active');
create policy tenants_update_admin on public.tenants
  for update using (public.has_role(id, array['owner','admin']::public.member_role[]))
  with check (public.has_role(id, array['owner','admin']::public.member_role[]));
create policy tenants_delete_owner on public.tenants
  for delete using (public.has_role(id, array['owner']::public.member_role[]));

-- dominios: lectura publica (necesaria para resolver el host), escritura owner/admin
create policy domains_read on public.tenant_domains for select using (true);
create policy domains_write on public.tenant_domains for all
  using (public.has_role(tenant_id, array['owner','admin']::public.member_role[]))
  with check (public.has_role(tenant_id, array['owner','admin']::public.member_role[]));

-- settings: lectura publica (branding del sitio), escritura miembros
create policy settings_read on public.tenant_settings for select using (true);
create policy settings_write on public.tenant_settings for all
  using (public.is_member(tenant_id)) with check (public.is_member(tenant_id));

-- memberships
create policy memberships_read on public.memberships
  for select using (user_id = auth.uid() or public.is_member(tenant_id));
create policy memberships_write on public.memberships for all
  using (public.has_role(tenant_id, array['owner','admin']::public.member_role[]))
  with check (public.has_role(tenant_id, array['owner','admin']::public.member_role[]));

-- invites
create policy invites_rw on public.tenant_invites for all
  using (public.has_role(tenant_id, array['owner','admin']::public.member_role[]))
  with check (public.has_role(tenant_id, array['owner','admin']::public.member_role[]));

-- catalogo: lectura publica solo de lo activo; escritura para miembros del tenant
create policy categories_read on public.categories
  for select using (is_active or public.is_member(tenant_id));
create policy categories_write on public.categories for all
  using (public.is_member(tenant_id)) with check (public.is_member(tenant_id));

create policy products_read on public.products
  for select using (is_active or public.is_member(tenant_id));
create policy products_write on public.products for all
  using (public.is_member(tenant_id)) with check (public.is_member(tenant_id));

create policy product_images_read on public.product_images for select using (true);
create policy product_images_write on public.product_images for all
  using (public.is_member(tenant_id)) with check (public.is_member(tenant_id));

create policy labels_read on public.label_templates
  for select using (public.is_member(tenant_id));
create policy labels_write on public.label_templates for all
  using (public.is_member(tenant_id)) with check (public.is_member(tenant_id));

-- ---------------------------------------------------------------------
-- Storage: bucket publico "media", carpeta raiz = tenant_id
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy media_public_read on storage.objects
  for select using (bucket_id = 'media');

create policy media_member_write on storage.objects
  for insert with check (
    bucket_id = 'media'
    and public.is_member(nullif((storage.foldername(name))[1], '')::uuid)
  );

create policy media_member_update on storage.objects
  for update using (
    bucket_id = 'media'
    and public.is_member(nullif((storage.foldername(name))[1], '')::uuid)
  );

create policy media_member_delete on storage.objects
  for delete using (
    bucket_id = 'media'
    and public.is_member(nullif((storage.foldername(name))[1], '')::uuid)
  );

-- ---------------------------------------------------------------------
-- Equipo: emails de auth.users solo para miembros del mismo tenant
-- ---------------------------------------------------------------------
create or replace function public.tenant_members(p_tenant uuid)
returns table (user_id uuid, email text, role public.member_role, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $fn$
begin
  if not public.is_member(p_tenant) then
    raise exception 'sin acceso a este vivero';
  end if;

  return query
    select m.user_id, u.email::text, m.role, m.created_at
    from public.memberships m
    join auth.users u on u.id = m.user_id
    where m.tenant_id = p_tenant
    order by m.created_at;
end $fn$;

revoke all on function public.tenant_members(uuid) from public;
grant execute on function public.tenant_members(uuid) to authenticated;
