import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireTenant } from '@/lib/tenant';
import { getCategoryBySlug, getCategoryTree, getProductsInBranch, getAttributeDefinitions } from '@/lib/queries';
import { categoryPath } from '@/lib/format';
import ProductCard from '@/components/site/ProductCard';

export const revalidate = 120;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const tenant = await requireTenant();
  const category = await getCategoryBySlug(tenant.id, slug);
  if (!category) return {};
  return { title: category.name, description: category.description || undefined };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const tenant = await requireTenant();

  const category = await getCategoryBySlug(tenant.id, slug);
  if (!category) notFound();

  const [tree, products, definitions] = await Promise.all([
    getCategoryTree(tenant.id),
    getProductsInBranch(tenant.id, category.id),
    getAttributeDefinitions(tenant.id),
  ]);

  const trail = categoryPath(tree, category.id);
  const node = trail[trail.length - 1];
  const subcategories = node?.children ?? [];

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <nav aria-label="Ruta" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
        <Link href="/" className="hover:text-primary">
          Inicio
        </Link>
        {trail.map((c, i) => (
          <span key={c.id} className="flex items-center gap-2">
            <span aria-hidden className="text-line">
              /
            </span>
            {i === trail.length - 1 ? (
              <span className="text-ink">{c.name}</span>
            ) : (
              <Link href={`/categoria/${c.slug}`} className="hover:text-primary">
                {c.name}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <header className="border-b border-line pb-8">
        <h1 className="font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-none text-ink">
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-ink-soft">
            {category.description}
          </p>
        )}
      </header>

      {subcategories.length > 0 && (
        <ul className="mt-8 flex flex-wrap gap-2">
          {subcategories.map((c) => (
            <li key={c.id}>
              <Link
                href={`/categoria/${c.slug}`}
                className="inline-block border border-line bg-card px-4 py-2 text-sm text-ink transition-colors hover:border-primary hover:text-primary"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section className="mt-10">
        {products.length === 0 ? (
          <div className="border border-dashed border-line p-12 text-center text-ink-soft">
            Todavía no hay plantas cargadas en esta categoría.
          </div>
        ) : (
          <>
            <p className="mb-5 text-sm text-ink-soft">
              {products.length} {products.length === 1 ? 'planta' : 'plantas'}
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
          </>
        )}
      </section>
    </div>
  );
}
