import { ROOT_DOMAIN } from '@/lib/config';
import { getMyTenants, getUser } from '@/lib/auth';
import CreateTenantForm from '@/components/admin/CreateTenantForm';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Elegi tu vivero' };

export default async function NoTenantPage() {
  const user = await getUser();
  if (!user) redirect('/admin/login');

  const tenants = await getMyTenants();

  return (
    <div className="mx-auto max-w-lg px-5 py-20">
      <h1 className="font-display text-4xl leading-none text-ink">
        {tenants.length ? 'Entra a tu vivero' : 'Crea tu vivero'}
      </h1>
      <p className="mt-3 leading-relaxed text-ink-soft">
        Esta direccion no corresponde a ningun vivero. Cada vivero vive en su propio subdominio.
      </p>

      {tenants.length > 0 && (
        <ul className="mt-8 divide-y divide-line border border-line bg-white">
          {tenants.map((t) => (
            <li key={t.id}>
              <a
                href={`https://${t.slug}.${ROOT_DOMAIN}/admin`}
                className="block px-4 py-3 transition-colors hover:bg-surface"
              >
                <span className="block text-ink">{t.name}</span>
                <span className="block text-xs text-ink-soft">
                  {t.slug}.{ROOT_DOMAIN} · {t.role}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10 border-t border-line pt-8">
        <h2 className="font-display text-2xl leading-none text-ink">Crear uno nuevo</h2>
        <CreateTenantForm rootDomain={ROOT_DOMAIN} />
      </div>
    </div>
  );
}
