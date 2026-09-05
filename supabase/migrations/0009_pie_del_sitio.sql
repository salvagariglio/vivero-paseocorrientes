-- =====================================================================
-- El pie del sitio deja de ser una lista de datos sueltos.
-- 1. logo_dark_url: version clara del logo, para el bloque oscuro del
--    pie. Si no la cargan, el logo comun se muestra sobre una placa.
-- 2. whatsapp_message: el texto con el que se abre la conversacion.
-- 3. Los textos del pie viven en content, como los de la portada.
-- =====================================================================

alter table public.tenant_settings
  add column if not exists logo_dark_url text,
  add column if not exists whatsapp_message text;

comment on column public.tenant_settings.logo_dark_url is
  'Logo en version clara, para fondos oscuros (pie del sitio). Opcional: sin esto el logo comun va sobre una placa clara.';

comment on column public.tenant_settings.whatsapp_message is
  'Mensaje con el que se abre WhatsApp desde el sitio. Opcional.';

comment on column public.tenant_settings.content is
  'Textos editables del sitio. Portada: hero_cta, categories_title, categories_note, promos_title, featured_title, references_title. Pie: footer_title, footer_note, footer_cta, footer_contact_title, footer_nav_title. Lo que falte cae al texto por defecto de la app.';
