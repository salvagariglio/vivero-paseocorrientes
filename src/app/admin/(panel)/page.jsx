import Link from 'next/link';
import { requireAdminContext } from '@/lib/auth';
import { tenantOrigin } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

function Stat({ label, value, href }) {
  const body = (
    <div className="rounded-card border border-line bg-card p-5">
      <p className="font-display text-4xl leading-none text-ink tabular-nums">{value}</p>
      <p className="mt-2 text-sm text-ink-soft">{label}</p>
    </div>
  );
  return href ? (
    <Link href={href} className="transition-colors hover:border-primary [&>div]:hover:border-primary">
      {body}
    </Link>
  ) : (
    body
  );
}

export default async function DashboardPage() {
  const { tenant, supabase } = await requireAdminContext();

  const [products, published, categories, promos] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id)
      .eq('is_active', true),
    supabase
      .from('categories')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id),
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id)
      .not('promo_price', 'is', null),
  ]);

  const origin = tenantOrigin(tenant);

  return (
    <div>
      <h1 className="font-display text-4xl leading-none text-ink">Panel de {tenant.name}</h1>
      <p className="mt-3 text-ink-soft">
        Tu catálogo vive en{' '}
        <a href={origin} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">
          {origin.replace(/^https?:\/\//, '')}
        </a>
        . Todo lo que edites acá se actualiza ahí y en los QR ya impresos.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Plantas cargadas" value={products.count ?? 0} href="/admin/productos" />
        <Stat label="Publicadas" value={published.count ?? 0} href="/admin/productos" />
        <Stat label="Categorías" value={categories.count ?? 0} href="/admin/categorias" />
        <Stat label="Con promoción" value={promos.count ?? 0} href="/admin/productos" />
      </div>

      <section className="mt-12 border-t border-line pt-8">
        <h2 className="font-display text-2xl leading-none text-ink">Por dónde seguir</h2>
        <ul className="mt-5 divide-y divide-line rounded-card border border-line bg-card">
          {[
            {
              href: '/admin/productos/nuevo',
              title: 'Cargar una planta',
              text: 'Nombre, foto, precio y datos de cuidado.',
            },
            {
              href: '/admin/categorias',
              title: 'Organizar el catálogo',
              text: 'Categorías y subcategorías del menú.',
            },
            {
              href: '/admin/etiquetas',
              title: 'Imprimir etiquetas con QR',
              text: 'Elegí las plantas y sacá la hoja lista para cortar.',
            },
            {
              href: '/admin/ajustes',
              title: 'Marca y datos del vivero',
              text: 'Logo, colores, horarios y contacto.',
            },
          ].map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="block p-5 transition-colors hover:bg-surface">
                <p className="font-medium text-ink">{item.title}</p>
                <p className="mt-1 text-sm text-ink-soft">{item.text}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
