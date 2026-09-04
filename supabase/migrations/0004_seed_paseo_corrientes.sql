-- =====================================================================
-- Primer vivero: Paseo Corrientes.
-- Colores y referencias salen del manual de marca, no de la app.
-- =====================================================================

do $seed$
declare
  v_tenant uuid;
  -- Cambiar por el email del dueno antes de correr esta migracion en
  -- un entorno nuevo. Al entrar por primera vez, claim_invites() lo
  -- convierte en owner del vivero.
  v_owner_email citext := 'duenio@ejemplo.com';
begin
  insert into public.tenants (slug, name)
  values ('paseo-corrientes', 'Paseo Corrientes')
  on conflict (slug) do update set name = excluded.name
  returning id into v_tenant;

  if v_tenant is null then
    select id into v_tenant from public.tenants where slug = 'paseo-corrientes';
  end if;

  -- ---------------------------------------------------------------
  -- Marca
  -- ---------------------------------------------------------------
  insert into public.tenant_settings (tenant_id, tagline, theme, typeset)
  values (
    v_tenant,
    'Vivero, plantas y flores en el corazon de Corrientes.',
    jsonb_build_object(
      'surface',        '#efebe8',  -- papel
      'surface_alt',    '#e6e2db',  -- bloques y fichas
      'card',           '#faf8f5',
      'ink',            '#2c4c47',  -- verde profundo como tinta
      'ink_soft',       '#7e6e5e',  -- tierra seca
      'on_dark',        '#efebe8',
      'line',           '#d8d1c4',  -- arena grisacea
      'primary',        '#3f7064',  -- verde bajo (logo)
      'primary_deep',   '#2c4c47',  -- verde profundo
      'secondary',      '#2b5462',  -- azul profundo (carteleria)
      'secondary_soft', '#387090',  -- azul bajo
      'earth',          '#7e6e5e',
      'accent',         '#c44f50'   -- rojo terracota
    ),
    'bosque'
  )
  on conflict (tenant_id) do update
    set theme = excluded.theme,
        typeset = excluded.typeset,
        tagline = coalesce(public.tenant_settings.tagline, excluded.tagline);

  -- ---------------------------------------------------------------
  -- Hosts (el de produccion se agrega desde el panel)
  -- ---------------------------------------------------------------
  insert into public.tenant_domains (tenant_id, host, is_primary)
  values (v_tenant, 'paseo-corrientes.localhost', true)
  on conflict (host) do nothing;

  -- ---------------------------------------------------------------
  -- Etiquetas: la azul replica la carteleria del local,
  -- la de arena replica el colgante del manual.
  -- ---------------------------------------------------------------
  insert into public.label_templates
    (tenant_id, name, width_mm, height_mm, qr_mm, gap_mm, margin_mm, page_size,
     show_logo, show_price, show_description, show_scientific,
     bg_token, fg_token, accent_token, is_default)
  values
    (v_tenant, 'Cartel azul', 60, 90, 24, 4, 8, 'A4',
     true, true, true, true, 'secondary', 'on_dark', 'accent', true),
    (v_tenant, 'Colgante arena', 45, 80, 20, 4, 8, 'A4',
     true, false, false, true, 'surface_alt', 'ink', 'accent', false)
  on conflict do nothing;

  -- ---------------------------------------------------------------
  -- Referencias (el cartel de la entrada, hecho dato)
  -- ---------------------------------------------------------------
  insert into public.attribute_definitions
    (tenant_id, key, label, kind, options, position, show_on_label, show_on_card)
  values
    (v_tenant, 'riego', 'Riego', 'scale', jsonb_build_array(
        jsonb_build_object('value','poco',     'label','Poco',      'icon','gota-1'),
        jsonb_build_object('value','moderado', 'label','Moderado',  'icon','gota-2'),
        jsonb_build_object('value','mucho',    'label','Mucho',     'icon','gota-3')
      ), 1, true, true),

    (v_tenant, 'ubicacion', 'Ubicacion', 'scale', jsonb_build_array(
        jsonb_build_object('value','interior', 'label','Interior',  'icon','arco-doble'),
        jsonb_build_object('value','galeria',  'label','Galeria',   'icon','arco-simple'),
        jsonb_build_object('value','exterior', 'label','Exterior',  'icon','circulo')
      ), 2, true, true),

    (v_tenant, 'sol', 'Exposicion al sol', 'scale', jsonb_build_array(
        jsonb_build_object('value','sombra',     'label','Sombra',     'icon','sol-0'),
        jsonb_build_object('value','semisombra', 'label','Semisombra', 'icon','sol-1'),
        jsonb_build_object('value','sol',        'label','Sol',        'icon','sol-2')
      ), 3, true, true),

    (v_tenant, 'frio', 'Resistencia al frio', 'scale', jsonb_build_array(
        jsonb_build_object('value','no-tolera',       'label','No tolera',       'icon','copo-0'),
        jsonb_build_object('value','poco-resistente', 'label','Poco resistente', 'icon','copo-1'),
        jsonb_build_object('value','muy-resistente',  'label','Muy resistente',  'icon','copo-2')
      ), 4, true, false),

    (v_tenant, 'hoja', 'Hoja', 'single', jsonb_build_array(
        jsonb_build_object('value','perenne', 'label','Perenne', 'icon','hoja-perenne'),
        jsonb_build_object('value','caduca',  'label','Caduca',  'icon','circulo')
      ), 5, true, false),

    (v_tenant, 'floracion', 'Floracion', 'multi', jsonb_build_array(
        jsonb_build_object('value','verano',    'label','Verano',    'icon','sol-2'),
        jsonb_build_object('value','otono',     'label','Otono',     'icon','hoja-otono'),
        jsonb_build_object('value','invierno',  'label','Invierno',  'icon','copo-2'),
        jsonb_build_object('value','primavera', 'label','Primavera', 'icon','flor')
      ), 6, true, false)
  on conflict (tenant_id, key) do update
    set label = excluded.label,
        kind = excluded.kind,
        options = excluded.options,
        position = excluded.position;

  -- ---------------------------------------------------------------
  -- El dueno se vincula solo la primera vez que entra
  -- ---------------------------------------------------------------
  insert into public.tenant_invites (tenant_id, email, role)
  values (v_tenant, v_owner_email, 'owner')
  on conflict (tenant_id, email) do update set role = 'owner', accepted_at = null;
end $seed$;
