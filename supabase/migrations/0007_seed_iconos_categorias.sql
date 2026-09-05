-- Iconos de las categorias de Paseo Corrientes.
-- Las claves son del registro en src/components/icons/CategoryIcon.jsx.

update public.categories c
   set icon = v.icon
  from (values
    -- familias
    ('arboles',                        'arbol'),
    ('frutales-y-citricos',            'frutal'),
    ('arbustivas',                     'arbustiva'),
    ('herbaceas-y-cubresuelos',        'herbacea'),
    ('interior-y-tropicales',          'tropical'),
    ('vivero',                         'maceta'),
    -- subcategorias
    ('arboles-de-vereda-y-cortinas',   'arbol-vereda'),
    ('arboles-ornamentales',           'arbol-ornamental'),
    ('arboles-nativos',                'arbol-nativo'),
    ('coniferas',                      'conifera'),
    ('palmeras',                       'palmera'),
    ('frutales',                       'frutal'),
    ('citricos',                       'citrico'),
    ('arbustivas-y-estructuras',       'arbustiva'),
    ('arbustivas-con-flor',            'arbustiva-flor'),
    ('cercos-vivos',                   'cerco'),
    ('rosas',                          'rosa'),
    ('herbaceas',                      'herbacea'),
    ('gramineas',                      'graminea'),
    ('rastreras-y-cubresuelos',        'rastrera'),
    ('trepadoras',                     'trepadora'),
    ('flores-y-plantines-de-estacion', 'flor'),
    ('aromaticas',                     'aromatica'),
    ('tropicales',                     'tropical'),
    ('plantas-de-interior',            'interior'),
    ('agaves-y-cactus',                'cactus'),
    ('accesorios-y-macetas',           'maceta'),
    ('sustratos',                      'sustrato')
  ) as v(slug, icon)
 where c.slug = v.slug
   and c.tenant_id = (select id from public.tenants where slug = 'paseo-corrientes');
