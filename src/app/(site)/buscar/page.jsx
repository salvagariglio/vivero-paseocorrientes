import { requireTenant } from '@/lib/tenant';
import { getProducts, getAttributeDefinitions } from '@/lib/queries';
import ProductCard from '@/components/site/ProductCard';

export const metadata = { title: 'Buscar' };

export default async function SearchPage({ searchParams }) {
  const { q = '' } = await searchParams;
  const tenant = await requireTenant();
  const term = q.trim();

  const [products, definitions] = await Promise.all([
    getProducts(tenant.id, term ? { search: term } : { limit: 60 }),
    getAttributeDefinitions(tenant.id),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="font-display text-[clamp(2.25rem,5vw,3.25rem)] leading-none text-ink">
        Buscar plantas
      </h1>

      <form action="/buscar" className="mt-7 flex max-w-xl gap-2">
        <input
          type="search"
          name="q"
          defaultValue={term}
          placeholder="Monstera, helecho, cactus…"
          aria-label="Buscar plantas"
          className="min-w-0 flex-1 border border-line bg-card px-4 py-3 text-ink placeholder:text-ink-soft/70"
        />
        <button
          type="submit"
          className="bg-primary px-6 py-3 text-sm font-medium text-on-dark transition-opacity hover:opacity-90"
        >
          Buscar
        </button>
      </form>

      <p className="mt-6 border-b border-line pb-3 text-sm text-ink-soft">
        {term
          ? `${products.length} ${products.length === 1 ? 'resultado' : 'resultados'} para “${term}”`
          : `${products.length} plantas en el catálogo`}
      </p>

      {products.length === 0 ? (
        <div className="mt-10 border border-dashed border-line p-12 text-center text-ink-soft">
          No encontramos plantas con ese nombre. Probá con otro término o mirá el catálogo completo.
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p, i) => (
            <ProductCard
              key={p.id}
              product={p}
              settings={tenant.settings}
              definitions={definitions}
              priority={i < 4}
            />
          ))}
        </div>
      )}
    </div>
  );
}
