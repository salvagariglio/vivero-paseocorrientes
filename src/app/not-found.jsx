import { ROOT_DOMAIN } from '@/lib/config';
import { getTenant } from '@/lib/tenant';
import Link from 'next/link';

export const metadata = { title: 'Página no encontrada' };

export default async function NotFound() {
  const tenant = await getTenant();

  return (
    <div className="flex min-h-dvh items-center justify-center px-5">
      <div className="max-w-lg">
        {tenant ? (
          <>
            <h1 className="font-display text-5xl leading-none text-ink">No encontramos eso</h1>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">
              La planta o categoría que buscabas ya no está publicada. Volvé al catálogo para ver
              todo lo que hay hoy en {tenant.name}.
            </p>
            <Link
              href="/"
              className="mt-8 inline-block rounded-pill bg-primary px-6 py-3 text-sm font-medium text-on-dark"
            >
              Ir al catálogo
            </Link>
          </>
        ) : (
          <>
            <h1 className="font-display text-5xl leading-none text-ink">
              Este dominio todavía no tiene vivero
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">
              No hay ningún vivero asignado a esta dirección. Si sos el dueño, agregá el dominio
              desde el panel, o entrá por tu subdominio <code>tu-vivero.{ROOT_DOMAIN}</code>.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
