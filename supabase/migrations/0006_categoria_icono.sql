-- =====================================================================
-- Icono por categoria.
--
-- Guarda una CLAVE del registro de dibujos, no un SVG ni una URL: asi el
-- ilustrador puede cambiar el trazo de "conifera" una vez y cambia en
-- todo el sitio, y un vivero nuevo elige de la misma lista.
-- Si la clave no existe, el renderer dibuja una hoja generica.
-- =====================================================================

alter table public.categories
  add column icon text;

comment on column public.categories.icon is
  'Clave del registro de iconos (src/components/icons/CategoryIcon.jsx). Sin valor, se dibuja una hoja generica.';
