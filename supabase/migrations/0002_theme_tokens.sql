-- =====================================================================
-- Marca: de 3 colores sueltos a un set de tokens con rol.
--
-- Un vivero puede tener 2 colores o 6: el codigo mapea ROLES, no
-- cantidades. Igual que products.attributes, crecer no pide migracion.
-- =====================================================================

alter table public.tenant_settings
  drop column brand_primary,
  drop column brand_accent,
  drop column brand_surface;

alter table public.tenant_settings
  add column theme jsonb not null default jsonb_build_object(
    -- superficies
    'surface',        '#eef1e9',   -- el papel del sitio
    'surface_alt',    '#dfe4da',   -- bloques, filas alternas
    'card',           '#ffffff',   -- fichas y formularios
    -- texto
    'ink',            '#16241c',   -- texto principal
    'ink_soft',       '#55655a',   -- texto secundario
    'on_dark',        '#f5f7f3',   -- texto sobre fondos oscuros
    'line',           '#cfd8cb',   -- bordes y divisores
    -- marca
    'primary',        '#3f7064',   -- acciones, enlaces
    'primary_deep',   '#2c4c47',   -- hover, fondos oscuros
    'secondary',      '#2b5462',   -- carteleria y etiquetas
    'secondary_soft', '#387090',
    'earth',          '#7e6e5e',   -- datos, metadatos
    'accent',         '#c44f50'    -- promociones y detalles
  ),
  -- Combinacion tipografica. El registro vive en src/lib/fonts.js
  -- porque next/font necesita imports estaticos.
  add column typeset text not null default 'bosque';

comment on column public.tenant_settings.theme is
  'Tokens de color por ROL, no por nombre de color. Claves esperadas: surface, surface_alt, card, ink, ink_soft, on_dark, line, primary, primary_deep, secondary, secondary_soft, earth, accent. Las que falten caen al default de la app.';

-- ---------------------------------------------------------------------
-- Las etiquetas eligen su fondo y su texto por token, no por hex.
-- Asi una etiqueta sigue la marca aunque el vivero cambie de paleta.
-- ---------------------------------------------------------------------
alter table public.label_templates
  add column bg_token text not null default 'card',
  add column fg_token text not null default 'ink',
  add column accent_token text not null default 'accent';
