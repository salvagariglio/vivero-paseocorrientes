/**
 * Links de contacto derivados de tenant_settings. Nada de esto se
 * hardcodea por vivero: si el dato no esta cargado, el link no existe
 * y quien lo consume decide si esconder la fila.
 */

const digits = (value) => String(value ?? '').replace(/\D/g, '');

/** wa.me con el mensaje de apertura que haya cargado el vivero. */
export function whatsappHref(settings) {
  const number = digits(settings?.whatsapp);
  if (!number) return null;
  const message = String(settings?.whatsapp_message ?? '').trim();
  return message
    ? `https://wa.me/${number}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${number}`;
}

/** El usuario sin arroba, que es como se guarda y como se muestra. */
export function instagramHandle(settings) {
  const raw = String(settings?.instagram ?? '').trim();
  if (!raw) return null;
  return raw.replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '');
}

export function instagramHref(settings) {
  const handle = instagramHandle(settings);
  return handle ? `https://instagram.com/${handle}` : null;
}

/**
 * La direccion siempre tiene que llevar a un mapa: si el vivero no
 * cargo el link de Google Maps, se arma la busqueda con la direccion.
 */
export function mapsHref(settings) {
  const url = String(settings?.maps_url ?? '').trim();
  if (url) return url;
  const address = String(settings?.address ?? '').trim();
  if (!address) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function phoneHref(settings) {
  const number = digits(settings?.phone);
  return number ? `tel:+${number}` : null;
}

export function emailHref(settings) {
  const email = String(settings?.email ?? '').trim();
  return email ? `mailto:${email}` : null;
}

/** Los tres links de siempre, para menus y barras. Solo los cargados. */
export function contactLinks(settings) {
  const handle = instagramHandle(settings);
  return [
    whatsappHref(settings) && {
      key: 'whatsapp',
      href: whatsappHref(settings),
      label: 'Escribinos por WhatsApp',
    },
    handle && { key: 'instagram', href: instagramHref(settings), label: `Instagram @${handle}` },
    mapsHref(settings) && { key: 'maps', href: mapsHref(settings), label: 'Cómo llegar' },
  ].filter(Boolean);
}
