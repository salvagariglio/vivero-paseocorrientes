import QRCode from 'qrcode';
import { getTenant, tenantUrl } from '@/lib/tenant';

export const runtime = 'nodejs';

/**
 * QR del tenant actual.
 *   /api/qr?slug=monstera            -> PNG de https://<host-del-vivero>/planta/monstera
 *   /api/qr?path=/categoria/interior -> QR de cualquier ruta interna
 *   &format=svg &size=1024 &dark=%23000000
 *
 * Solo codifica rutas propias del tenant: no acepta URLs externas.
 */
export async function GET(request) {
  const tenant = await getTenant();
  if (!tenant) {
    return new Response('Vivero no encontrado', { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const rawPath = searchParams.get('path');

  let path;
  if (slug) path = `/planta/${encodeURIComponent(slug)}`;
  else if (rawPath && rawPath.startsWith('/') && !rawPath.startsWith('//')) path = rawPath;
  else return new Response('Falta slug o path', { status: 400 });

  const size = Math.min(Math.max(Number(searchParams.get('size')) || 512, 96), 2048);
  const format = searchParams.get('format') === 'svg' ? 'svg' : 'png';
  const dark = sanitizeColor(searchParams.get('dark')) || '#16241c';
  const light = sanitizeColor(searchParams.get('light')) || '#ffffff';

  const target = tenantUrl(tenant, path);
  const options = {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: size,
    color: { dark, light },
  };

  const headers = {
    'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
  };

  if (format === 'svg') {
    const svg = await QRCode.toString(target, { ...options, type: 'svg' });
    return new Response(svg, {
      headers: { ...headers, 'Content-Type': 'image/svg+xml; charset=utf-8' },
    });
  }

  const png = await QRCode.toBuffer(target, { ...options, type: 'png' });
  return new Response(png, {
    headers: { ...headers, 'Content-Type': 'image/png' },
  });
}

function sanitizeColor(value) {
  if (!value) return null;
  return /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(value) ? value : null;
}
