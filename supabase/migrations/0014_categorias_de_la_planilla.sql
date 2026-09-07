-- =====================================================================
-- Como se llama cada categoria en la planilla, y como en el catalogo.
--
-- La carga inicial reagrupo las 23 categorias del listado en 6 familias
-- y las renombro ("ARBOLES - VEREDA - CORTINAS" quedo como "Árboles de
-- vereda y cortinas"). Ese mapa vivia en una constante del script, asi
-- que una planta nueva se cargaba sin categoria.
--
-- Ahora es dato del vivero: se corrige desde el panel al importar y se
-- guarda solo. Esto es la semilla con los valores que hoy trae la
-- planilla de Paseo Corrientes, incluido el "PLAMERAS" con el typo.
-- =====================================================================

update public.tenant_settings s
   set price_import = s.price_import || jsonb_build_object('categories', jsonb_build_object(
         'ARBOLES - VEREDA - CORTINAS',          'arboles-de-vereda-y-cortinas',
         'ARBOLES ORNAMENTALES UNICOS',          'arboles-ornamentales',
         'ARBOLES NATIVOS',                      'arboles-nativos',
         'CONIFERAS',                            'coniferas',
         'PLAMERAS',                             'palmeras',
         'FRUTALES',                             'frutales',
         'CITRICOS',                             'citricos',
         'ARBUSTIVAS / ESTRUCTURAS',             'arbustivas-y-estructuras',
         'ARBUSTIVAS CON FLOR',                  'arbustivas-con-flor',
         'CERCOS VIVOS',                         'cercos-vivos',
         'ROSAS',                                'rosas',
         'HERBACEAS',                            'herbaceas',
         'GRAMINEAS',                            'gramineas',
         'RASTRERAS (cubresuelos / tapizantes)', 'rastreras-y-cubresuelos',
         'TREPADORAS',                           'trepadoras',
         'FLORES Y PLANTINES DE ESTACION',       'flores-y-plantines-de-estacion',
         'AROMATICAS',                           'aromaticas',
         'TROPICALES',                           'tropicales',
         'PLANTAS DE INTERIOR',                  'plantas-de-interior',
         'AGAVES Y CACTUS',                      'agaves-y-cactus',
         'ACCESORIOS / MACETAS',                 'accesorios-y-macetas',
         'SUSTRATOS / TERRAFERTIL',              'sustratos',
         'SUSTRATOS',                            'sustratos'
       ))
 where s.tenant_id = (select id from public.tenants where slug = 'paseo-corrientes');
