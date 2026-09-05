import Link from 'next/link';
import { requireTenant } from '@/lib/tenant';
import { getAttributeDefinitions, getCategoryTree, getProducts } from '@/lib/queries';
import { categoryIconMap } from '@/lib/format';
import ProductCard from '@/components/site/ProductCard';
import CategoryIcon from '@/components/icons/CategoryIcon';

export const revalidate = 120;
export const metadata = { title: 'Catálogo' };

export default async function CatalogPage({ searchParams }) {
  const { q = '' } = await searchParams;
  const tenant = await requireTenant();
  const term = q.trim();

  const [products, tree, definitions] = await Promise.all([
    getProducts(tenant.id, term ? { search: term } : { limit: 500 }),
    getCategoryTree(tenant.id),
    getAttributeDefinitions(tenant.id),
  ]);

  const iconByCategory = categoryIconMap(tree);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="font-display text-[clamp(2.25rem,5vw,3.25rem)] leading-none text-primary-deep">
        Catálogo
      </h1>
      <div className="mt-4 h-0.5 w-14 rounded-pill bg-accent" />

      <form action="/catalogo" className="mt-7 flex max-w-xl gap-2">
        <input
          type="search"
          name="q"
          defaultValue={term}
          placeholder="Buscá por nombre o especie…"
          aria-label="Buscar en el catálogo"
          className="min-w-0 flex-1 rounded-pill border border-line bg-card px-5 py-3 text-ink placeholder:text-earth/60"
        />
        <button
          type="submit"
          className="rounded-pill bg-primary px-6 py-3 text-sm font-medium text-on-dark transition-opacity hover:opacity-90"
        >
          Buscar
        </button>
      </form>

      {tree.length > 0 && (
        <ul className="mt-7 flex flex-wrap gap-2">
          {tree.map((cat) => (
            <li key={cat.id}>
              <Link
                href={`/categoria/${cat.slug}`}
                className="flex items-center gap-2 rounded-pill border border-primary/25 py-2 pl-3 pr-5 text-sm text-primary-deep transition-colors hover:bg-primary hover:text-on-dark"
              >
                <CategoryIcon name={cat.icon} size={22} />
                {cat.name}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 caption text-[0.65rem] text-earth">
        {term
          ? `${products.length} ${products.length === 1 ? 'resultado' : 'resultados'} para “${term}”`
          : `${products.length} plantas y productos`}
      </p>

      {products.length === 0 ? (
        <div className="mt-6 rounded-card border border-dashed border-line p-12 text-center text-earth">
          No encontramos nada con ese nombre. Probá con otro término o entrá por una familia.
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p, i) => (
            <ProductCard
              key={p.id}
              product={p}
              settings={tenant.settings}
              definitions={definitions}
              iconByCategory={iconByCategory}
              priority={i < 4}
            />
          ))}
        </div>
      )}
    </div>
  );
}
