import Link from 'next/link';
import Image from 'next/image';
import { requireTenant } from '@/lib/tenant';
import { getCategoryTree, getProducts, getAttributeDefinitions } from '@/lib/queries';
import ProductCard from '@/components/site/ProductCard';

export const revalidate = 120;

function SectionHead({ title, note, href, hrefLabel }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
      <div>
        <h2 className="font-display text-3xl leading-none text-ink">{title}</h2>
        {note && <p className="mt-2 text-sm text-ink-soft">{note}</p>}
      </div>
      {href && (
        <Link href={href} className="text-sm text-primary underline underline-offset-4">
          {hrefLabel}
        </Link>
      )}
    </div>
  );
}

export default async function HomePage() {
  const tenant = await requireTenant();
  const s = tenant.settings;

  const [tree, featured, promos, definitions] = await Promise.all([
    getCategoryTree(tenant.id),
    getProducts(tenant.id, { featured: true, limit: 8 }),
    getProducts(tenant.id, { limit: 60 }),
    getAttributeDefinitions(tenant.id),
  ]);

  const onPromo = promos.filter((p) => p.promo_price != null).slice(0, 4);
  const latest = promos.slice(0, 8);

  return (
    <>
      {/* Hero editorial: el nombre del vivero como pieza tipografica */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-6xl items-stretch gap-0 px-5 md:grid-cols-[1fr_1fr]">
          <div className="flex flex-col justify-center py-14 pr-0 md:py-24 md:pr-10">
            <h1 className="font-display text-[clamp(2.75rem,7vw,4.75rem)] leading-[0.95] text-ink">
              {tenant.name}
            </h1>
            {s.tagline && (
              <p className="mt-5 max-w-[42ch] text-lg leading-relaxed text-ink-soft">
                {s.tagline}
              </p>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={tree[0] ? `/categoria/${tree[0].slug}` : '/buscar'}
                className="bg-primary px-6 py-3 text-sm font-medium text-on-dark transition-opacity hover:opacity-90"
              >
                Ver el catálogo
              </Link>
              {s.maps_url && (
                <a
                  href={s.maps_url}
                  target="_blank"
                  rel="noreferrer"
                  className="border border-ink/20 px-6 py-3 text-sm font-medium text-ink hover:border-ink/50"
                >
                  Cómo llegar
                </a>
              )}
            </div>
          </div>

          {s.cover_url && (
            <div className="relative min-h-[16rem] md:min-h-[28rem]">
              <Image
                src={s.cover_url}
                alt=""
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                priority
                className="object-cover"
              />
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-16">
        {/* Categorias */}
        {tree.length > 0 && (
          <section className="mb-20">
            <SectionHead
              title="Qué buscás"
              note="Cada categoría agrupa sus subcategorías y plantas."
            />
            <ul className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
              {tree.map((cat) => (
                <li key={cat.id} className="bg-surface">
                  <Link
                    href={`/categoria/${cat.slug}`}
                    className="flex h-full flex-col gap-2 p-6 transition-colors hover:bg-card"
                  >
                    <span className="font-display text-2xl text-ink">{cat.name}</span>
                    {cat.children.length > 0 && (
                      <span className="text-sm leading-relaxed text-ink-soft">
                        {cat.children.map((c) => c.name).join(' · ')}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Promos */}
        {onPromo.length > 0 && (
          <section className="mb-20">
            <SectionHead title="En promoción" note="Precios vigentes esta semana." />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {onPromo.map((p) => (
                <ProductCard key={p.id} product={p} settings={s} definitions={definitions} />
              ))}
            </div>
          </section>
        )}

        {/* Destacados / todo */}
        {(featured.length > 0 || latest.length > 0) && (
          <section>
            <SectionHead
              title={featured.length > 0 ? 'Destacadas' : 'En el vivero'}
              href="/buscar"
              hrefLabel="Ver todas"
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {(featured.length > 0 ? featured : latest).map((p, i) => (
                <ProductCard key={p.id} product={p} settings={s} definitions={definitions} priority={i < 4} />
              ))}
            </div>
          </section>
        )}

        {tree.length === 0 && latest.length === 0 && (
          <div className="border border-dashed border-line p-12 text-center">
            <p className="font-display text-2xl text-ink">El catálogo está vacío</p>
            <p className="mt-2 text-ink-soft">
              Cargá categorías y plantas desde el panel para que aparezcan acá.
            </p>
            <Link
              href="/admin"
              className="mt-6 inline-block bg-primary px-5 py-2.5 text-sm font-medium text-on-dark"
            >
              Ir al panel
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
