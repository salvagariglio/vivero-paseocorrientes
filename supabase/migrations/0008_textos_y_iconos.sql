-- =====================================================================
-- 1. Los iconos son de familia. Las subcategorias se distinguen por
--    nombre dentro de su familia y no necesitan dibujo propio.
-- 2. Los textos de la portada dejan de estar en el codigo.
-- =====================================================================

update public.categories
   set icon = null
 where parent_id is not null;

alter table public.categories
  add constraint categories_icon_solo_familias
  check (icon is null or parent_id is null);

alter table public.tenant_settings
  add column content jsonb not null default '{}'::jsonb;

comment on column public.tenant_settings.content is
  'Textos editables de la portada. Claves: hero_cta, categories_title, categories_note, promos_title, promos_note, featured_title, references_title. Lo que falte cae al texto por defecto de la app.';
