import Link from 'next/link';
import { getMyTenants } from '@/lib/auth';
import { ROOT_DOMAIN } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Sin acceso' };

export default async function NoAccessPage() {
  const tenants = await getMyTenants();

  return (
    <div className="mx-auto max-w-lg px-5 py-20">
      <h1 className="font-display text-4xl leading-none text-ink">No tenes acceso a este vivero</h1>
      <p className="mt-3 leading-relaxed text-ink-soft">
        Tu cuenta existe pero todavia nadie te sumo a este vivero. Pedile a quien lo administra que
        te invite con tu email.
      </p>

      {tenants.length > 0 && (
        <>
          <p className="mt-8 text-sm text-ink-soft">Si tenes acceso a otros:</p>
          <ul className="mt-3 divide-y divide-line border border-line bg-white">
            {tenants.map((t) => (
              <li key={t.id}>
                <a
                  href={`https://${t.slug}.${ROOT_DOMAIN}/admin`}
                  className="block px-4 py-3 hover:bg-surface"
                >
                  {t.name}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}

      <Link href="/" className="mt-8 inline-block text-sm text-primary underline underline-offset-4">
        Ir al catalogo
      </Link>
    </div>
  );
}
