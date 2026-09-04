import Link from 'next/link';
import Image from 'next/image';
import { requireTenant } from '@/lib/tenant';
import { getAttributeDefinitions, getCategoryTree, getProducts } from '@/lib/queries';
import ProductCard from '@/components/site/ProductCard';

export const revalidate = 120;

/** Banda verde con el titulo, el recurso de seccion del manual. */
function SectionHead({ title, note, href, hrefLabel }) {
  return (
    <div className="mb-5">
      <div className="band flex flex-wrap items-center justify-between gap-3 px-7 py-3.5">
        <h2 className="font-display text-2xl leading-none">{title}</h2>
        {href && (
          <Link href={href} className="caption text-[0.65rem] underline underline-offset-4">
            {hrefLabel}
          </Link>
        )}
      </div>
      {note && <p className="mt-3 px-1 text-sm text-earth">{note}</p>}
    </div>
  );
}

export default async function HomePage() {
  const tenant = await requireTenant();
  const s = tenant.settings;

  const [tree, featured, catalogo, definitions] = await Promise.all([
    getCategoryTree(tenant.id),
    getProducts(tenant.id, { featured: true, limit: 8 }),
    getProducts(tenant.id, { limit: 60 }),
    getAttributeDefinitions(tenant.id),
  ]);

  const onPromo = catalogo.filter((p) => p.promo_price != null).slice(0, 4);
  const latest = catalogo.slice(0, 8);

  return (
    <>
      {/* Hero: el nombre del vivero como pieza tipografica, en verde */}
      <section>
        <div className="mx-auto grid max-w-6xl items-stretch gap-8 px-5 py-12 md:grid-cols-[1fr_1fr] md:py-16">
          <div className="flex flex-col justify-center md:pr-8">
            <h1 className="font-display text-[clamp(2.75rem,7vw,4.75rem)] leading-[0.95] text-primary-deep">
              {tenant.name}
            </h1>
            <div className="mt-5 h-0.5 w-14 rounded-pill bg-accent" />

            {s.tagline && (
              <p className="mt-5 max-w-[42ch] text-lg leading-relaxed text-earth">{s.tagline}</p>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={tree[0] ? `/categoria/${tree[0].slug}` : '/buscar'}
                className="rounded-pill bg-primary px-7 py-3 text-sm font-medium text-on-dark transition-opacity hover:opacity-90"
              >
                Ver el catálogo
              </Link>
              {s.maps_url && (
                <a
                  href={s.maps_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-pill border border-primary/30 px-7 py-3 text-sm font-medium text-primary-deep transition-colors hover:border-primary"
                >
                  Cómo llegar
                </a>
              )}
            </div>
          </div>

          {s.cover_url && (
            <div className="relative min-h-[16rem] overflow-hidden rounded-lg md:min-h-[26rem]">
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

      <div className="mx-auto max-w-6xl px-5 pb-16">
        {tree.length > 0 && (
          <section className="mb-16">
            <SectionHead title="Qué buscás" note="Cada familia agrupa sus subcategorías y plantas." />
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tree.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/categoria/${cat.slug}`}
                    className="panel flex h-full flex-col gap-2 p-6 transition-colors hover:bg-line/60"
                  >
                    <span className="font-display text-2xl text-primary-deep">{cat.name}</span>
                    {cat.children.length > 0 && (
                      <span className="text-sm leading-relaxed text-earth">
                        {cat.children.map((c) => c.name).join(' · ')}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {onPromo.length > 0 && (
          <section className="mb-16">
            <SectionHead title="En promoción" note="Precios vigentes esta semana." />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {onPromo.map((p) => (
                <ProductCard key={p.id} product={p} settings={s} definitions={definitions} />
              ))}
            </div>
          </section>
        )}

        {(featured.length > 0 || latest.length > 0) && (
          <section>
            <SectionHead
              title={featured.length > 0 ? 'Destacadas' : 'En el vivero'}
              href="/buscar"
              hrefLabel="Ver todas"
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(featured.length > 0 ? featured : latest).map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  settings={s}
                  definitions={definitions}
                  priority={i < 4}
                />
              ))}
            </div>
          </section>
        )}

        {tree.length === 0 && latest.length === 0 && (
          <div className="rounded-card border border-dashed border-line p-12 text-center">
            <p className="font-display text-2xl text-primary-deep">El catálogo está vacío</p>
            <p className="mt-2 text-earth">
              Cargá categorías y plantas desde el panel para que aparezcan acá.
            </p>
            <Link
              href="/admin"
              className="mt-6 inline-block rounded-pill bg-primary px-6 py-2.5 text-sm font-medium text-on-dark"
            >
              Ir al panel
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
