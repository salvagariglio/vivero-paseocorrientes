-- =====================================================================
-- Referencias: el sistema de carteleria, modelado.
--
-- Cada vivero define SUS referencias (riego, ubicacion, sol, frio...).
-- No hay campos fijos ni una lista de iconos cerrada en el codigo:
-- la definicion vive en la DB y la ficha la dibuja sola.
--
-- products.attributes guarda solo la respuesta:
--   { "riego": "mucho", "floracion": ["verano","primavera"] }
-- =====================================================================

create table public.attribute_definitions (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  key           citext not null,
  label         text not null,
  help          text,

  -- scale  : opciones ordenadas de menos a mas (Poco -> Mucho)
  -- single  : opciones sin orden, se elige una (Perenne / Caduca)
  -- multi   : se eligen varias (Floracion: verano + primavera)
  -- text    : texto libre
  kind          text not null default 'scale'
                check (kind in ('scale', 'single', 'multi', 'text')),

  -- [{ "value": "poco", "label": "Poco", "icon": "gota-1" }, ...]
  -- El icono es una clave; si el renderer no la conoce dibuja un punto.
  options       jsonb not null default '[]'::jsonb,

  position      integer not null default 0,
  show_on_label boolean not null default true,
  show_on_card  boolean not null default false,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  unique (tenant_id, key)
);
create index attribute_definitions_tenant_idx
  on public.attribute_definitions(tenant_id, position);

create trigger attribute_definitions_touch
  before update on public.attribute_definitions
  for each row execute function public.touch_updated_at();

alter table public.attribute_definitions enable row level security;

create policy attribute_definitions_read on public.attribute_definitions
  for select using (is_active or public.is_member(tenant_id));

create policy attribute_definitions_write on public.attribute_definitions
  for all
  using (public.is_member(tenant_id))
  with check (public.is_member(tenant_id));
