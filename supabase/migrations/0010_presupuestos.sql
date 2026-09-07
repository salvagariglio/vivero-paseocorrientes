-- =====================================================================
-- Presupuestos.
--
-- Un presupuesto es un documento, no una consulta: los precios se
-- CONGELAN al armarlo. Si manana cambia la lista, el presupuesto que ya
-- mandaste sigue diciendo lo mismo.
--
-- Las dos reglas del negocio son datos editables, no constantes:
--   - que una planta admita descuento o sea precio firme
--   - cuanto ajusta cada forma de pago
-- =====================================================================

-- ---------------------------------------------------------------------
-- Formas de pago. El ajuste es un porcentaje con signo:
-- negativo descuenta (efectivo -10), positivo recarga (credito +12).
-- ---------------------------------------------------------------------
create table public.payment_methods (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  name        text not null,
  adjust_pct  numeric(5,2) not null default 0
              check (adjust_pct between -100 and 100),
  position    integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index payment_methods_tenant_idx on public.payment_methods(tenant_id, position);

create trigger payment_methods_touch
  before update on public.payment_methods
  for each row execute function public.touch_updated_at();

-- Hay plantas que no entran en el descuento general.
alter table public.products
  add column allow_discount boolean not null default true;

comment on column public.products.allow_discount is
  'false = precio firme: el descuento general del presupuesto no la toca.';

-- ---------------------------------------------------------------------
-- Presupuestos
-- ---------------------------------------------------------------------
create table public.quotes (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references public.tenants(id) on delete cascade,
  number             integer not null,
  status             text not null default 'borrador'
                     check (status in ('borrador','enviado','aceptado','rechazado','vencido')),

  customer_name      text,
  customer_phone     text,
  customer_email     text,

  -- Forma de pago congelada: si manana cambia el porcentaje, este
  -- presupuesto sigue valiendo lo que decia.
  payment_method_id   uuid references public.payment_methods(id) on delete set null,
  payment_method_name text,
  payment_adjust_pct  numeric(5,2) not null default 0,

  discount_pct       numeric(5,2) not null default 0
                     check (discount_pct between 0 and 100),
  notes              text,
  valid_days         integer not null default 15 check (valid_days >= 0),

  created_by         uuid references auth.users(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  unique (tenant_id, number)
);
create index quotes_tenant_idx on public.quotes(tenant_id, created_at desc);

create trigger quotes_touch
  before update on public.quotes
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- Items. Todo lo que se imprime queda copiado aca.
-- product_id es solo la referencia de origen y puede quedar en null si
-- despues borran la planta: el presupuesto no se rompe.
-- ---------------------------------------------------------------------
create table public.quote_items (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  quote_id       uuid not null references public.quotes(id) on delete cascade,
  product_id     uuid references public.products(id) on delete set null,

  name           text not null,
  detail         text,
  unit_price     numeric(12,2) not null default 0,
  qty            numeric(10,2) not null default 1 check (qty > 0),
  allow_discount boolean not null default true,
  position       integer not null default 0
);
create index quote_items_quote_idx on public.quote_items(quote_id, position);

-- ---------------------------------------------------------------------
-- Numeracion correlativa por vivero
-- ---------------------------------------------------------------------
create or replace function public.next_quote_number(p_tenant uuid)
returns integer language sql stable security definer set search_path = public as $fn$
  select coalesce(max(number), 0) + 1 from public.quotes where tenant_id = p_tenant;
$fn$;

-- ---------------------------------------------------------------------
-- RLS: todo esto es interno del vivero, no se publica.
-- ---------------------------------------------------------------------
alter table public.payment_methods enable row level security;
alter table public.quotes          enable row level security;
alter table public.quote_items     enable row level security;

create policy payment_methods_rw on public.payment_methods for all
  using (public.is_member(tenant_id)) with check (public.is_member(tenant_id));

create policy quotes_rw on public.quotes for all
  using (public.is_member(tenant_id)) with check (public.is_member(tenant_id));

create policy quote_items_rw on public.quote_items for all
  using (public.is_member(tenant_id)) with check (public.is_member(tenant_id));

-- ---------------------------------------------------------------------
-- Formas de pago iniciales de Paseo Corrientes.
-- Van en 0: los porcentajes reales los carga el vivero desde el panel.
-- ---------------------------------------------------------------------
insert into public.payment_methods (tenant_id, name, adjust_pct, position)
select t.id, v.name, 0, v.position
  from public.tenants t
 cross join (values ('Efectivo', 1), ('Débito', 2), ('Transferencia', 3)) as v(name, position)
 where t.slug = 'paseo-corrientes';
