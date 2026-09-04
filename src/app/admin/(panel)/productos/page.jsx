import Link from 'next/link';
import { requireAdminContext } from '@/lib/auth';
import { adminCategoryTree, adminProducts, flattenTree } from '@/lib/admin-queries';
import { formatPrice, promoState } from '@/lib/format';
import { toggleProductActive } from '@/app/admin/actions';

export const dynamic = 'force-dynamic';

export default async function ProductsPage({ searchParams }) {
  const { q = '', guardado } = await searchParams;
  const { tenant, supabase } = await requireAdminContext();

  const [products, tree] = await Promise.all([
    adminProducts(supabase, tenant.id, { search: q.trim() || undefined }),
    adminCategoryTree(supabase, tenant.id),
  ]);

  const categoryName = new Map(flattenTree(tree).map((c) => [c.id, c.name]));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl leading-none text-ink">Plantas</h1>
          <p className="mt-2 text-sm text-ink-soft">
            {products.length} {products.length === 1 ? 'planta' : 'plantas'} en el catálogo.
          </p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="rounded-pill bg-primary px-5 py-2.5 text-sm font-medium text-on-dark hover:opacity-90"
        >
          Cargar planta
        </Link>
      </div>

      {guardado && (
        <p role="status" className="mt-5 border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
          Guardamos los cambios de {guardado}.
        </p>
      )}

      <form action="/admin/productos" className="mt-6 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre, científico o código"
          aria-label="Buscar plantas"
          className="min-w-0 flex-1 rounded-card border border-line bg-card px-3 py-2.5 text-ink"
        />
        <button type="submit" className="border border-line px-4 text-sm text-ink hover:border-primary">
          Buscar
        </button>
      </form>

      {products.length === 0 ? (
        <div className="mt-10 rounded-card border border-dashed border-line p-12 text-center">
          <p className="font-display text-2xl text-ink">Todavía no cargaste plantas</p>
          <p className="mt-2 text-sm text-ink-soft">
            Cada planta que cargues genera su ficha y su QR automáticamente.
          </p>
          <Link
            href="/admin/productos/nuevo"
            className="mt-6 inline-block rounded-pill bg-primary px-5 py-2.5 text-sm font-medium text-on-dark"
          >
            Cargar la primera
          </Link>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-line rounded-card border border-line bg-card">
          {products.map((p) => {
            const promo = promoState(p);
            return (
              <li key={p.id} className="flex items-center gap-4 p-3">
                <div className="size-14 shrink-0 overflow-hidden bg-surface">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center font-display text-xl text-line">
                      {p.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/productos/${p.id}`}
                    className="block truncate font-medium text-ink hover:text-primary"
                  >
                    {p.name}
                  </Link>
                  <p className="truncate text-xs text-ink-soft">
                    {[categoryName.get(p.category_id), p.scientific_name]
                      .filter(Boolean)
                      .join(' · ') || 'Sin categoría'}
                  </p>
                </div>

                <div className="hidden w-28 shrink-0 text-right text-sm tabular-nums sm:block">
                  {promo.active ? (
                    <span className="text-accent">{formatPrice(promo.effective, tenant.settings)}</span>
                  ) : (
                    <span className="text-ink">{formatPrice(p.price, tenant.settings) ?? '—'}</span>
                  )}
                </div>

                <form action={toggleProductActive} className="shrink-0">
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="next" value={String(!p.is_active)} />
                  <button
                    type="submit"
                    className={`border px-3 py-1.5 text-xs transition-colors ${
                      p.is_active
                        ? 'border-primary/40 text-primary hover:bg-primary hover:text-on-dark'
                        : 'border-line text-ink-soft hover:border-ink'
                    }`}
                  >
                    {p.is_active ? 'Publicada' : 'Oculta'}
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
