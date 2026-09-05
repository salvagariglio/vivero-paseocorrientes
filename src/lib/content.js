/**
 * Textos del sitio. Viven en tenant_settings.content, y lo que el
 * vivero no complete cae al texto por defecto que define la app.
 * Agrupados como se editan en el panel.
 */
export const CONTENT_GROUPS = [
  {
    title: 'Textos de la portada',
    description: 'Si dejás algo vacío se usa el texto por defecto que aparece de guía.',
    keys: [
      { key: 'hero_cta', label: 'Botón principal', fallback: 'Ver el catálogo' },
      {
        key: 'categories_title',
        label: 'Título de familias',
        fallback: 'Recorré el vivero',
      },
      {
        key: 'categories_note',
        label: 'Bajada de familias',
        fallback: 'Entrá por donde te sea más fácil buscar.',
      },
      { key: 'promos_title', label: 'Título de promociones', fallback: 'En promoción' },
      { key: 'featured_title', label: 'Título de destacadas', fallback: 'Destacadas' },
      { key: 'references_title', label: 'Título de referencias', fallback: 'Referencias' },
    ],
  },
  {
    title: 'Textos del pie',
    description: 'El cierre del sitio: la invitación a escribir y los títulos de cada columna.',
    keys: [
      { key: 'footer_title', label: 'Invitación', fallback: '¿Buscás una planta?' },
      {
        key: 'footer_note',
        label: 'Bajada de la invitación',
        fallback: 'Escribinos y te decimos si la tenemos.',
      },
      { key: 'footer_cta', label: 'Botón de WhatsApp', fallback: 'Escribinos por WhatsApp' },
      { key: 'footer_contact_title', label: 'Título de contacto', fallback: 'Dónde estamos' },
      { key: 'footer_nav_title', label: 'Título del catálogo', fallback: 'El catálogo' },
    ],
  },
];

export const CONTENT_KEYS = CONTENT_GROUPS.flatMap((group) => group.keys);

const FALLBACKS = Object.fromEntries(CONTENT_KEYS.map((c) => [c.key, c.fallback]));

/** Devuelve el texto del vivero o el de la app. */
export function copy(settings, key) {
  const value = settings?.content?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : (FALLBACKS[key] ?? '');
}
