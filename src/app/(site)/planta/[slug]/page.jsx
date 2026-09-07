import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireTenant, tenantUrl } from '@/lib/tenant';
import {
  getAttributeDefinitions,
  getCategoryTree,
  getProductBySlug,
  getProductsInBranch,
} from '@/lib/queries';
import { categoryPath, categoryIconMap, formatPrice, promoState } from '@/lib/format';
import ProductGallery from '@/components/site/ProductGallery';
import ProductCard from '@/components/site/ProductCard';
import AttributeReferences from '@/components/site/AttributeReferences';
import { PromoBadge } from '@/components/site/PriceTag';
import AddToOrder from '@/components/site/AddToOrder';

export const revalidate = 120;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const tenant = await requireTenant();
  const product = await getProductBySlug(tenant.id, slug);
  if (!product) return {};

  return {
    title: product.name,
    description: product.short_description || product.description?.slice(0, 160) || undefined,
    openGraph: { images: product.image_url ? [product.image_url] : undefined },
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const tenant = await requireTenant();
  const s = tenant.settings;

  const product = await getProductBySlug(tenant.id, slug);
  if (!product) notFound();

  const [tree, definitions] = await Promise.all([
    getCategoryTree(tenant.id),
    getAttributeDefinitions(tenant.id),
  ]);

  const iconByCategory = categoryIconMap(tree);
  const trail = product.category_id ? categoryPath(tree, product.category_id) : [];

  const siblings = product.category_id
    ? (await getProductsInBranch(tenant.id, product.category_id))
        .filter((p) => p.id !== product.id)
        .slice(0, 4)
    : [];

  const images = product.images?.length
    ? product.images
    : product.image_url
      ? [{ id: 'main', url: product.image_url, alt: product.name }]
      : [];

  const promo = promoState(product);
  const wa = s.whatsapp ? String(s.whatsapp).replace(/\D/g, '') : null;
  const shareUrl = tenantUrl(tenant, `/planta/${product.slug}`);

  return (
    <article className="mx-auto max-w-6xl px-5 py-12">
      <nav aria-label="Ruta" className="mb-8 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
        <Link href="/" className="hover:text-primary">
          Inicio
        </Link>
        {trail.map((c) => (
          <span key={c.id} className="flex items-center gap-2">
            <span aria-hidden className="text-line">
              /
            </span>
            <Link href={`/categoria/${c.slug}`} className="hover:text-primary">
              {c.name}
            </Link>
          </span>
        ))}
      </nav>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <ProductGallery
          images={images}
          name={product.name}
          icon={iconByCategory[product.category_id]}
        />

        <div className="flex flex-col">
          <div className="mb-4">
            <PromoBadge product={product} />
          </div>

          <h1 className="font-display text-[clamp(2.25rem,5vw,3.25rem)] leading-[1.02] text-primary-deep">
            {product.name}
          </h1>

          {product.scientific_name && (
            <p className="binomial mt-2 text-xl">{product.scientific_name}</p>
          )}

          {s.show_prices && promo.effective != null && (
            <div className="mt-6 flex flex-wrap items-baseline gap-3 border-y border-line py-5">
              <span
                className={`font-display text-4xl tabular-nums ${
                  promo.active ? 'text-accent' : 'text-primary-deep'
                }`}
              >
                {formatPrice(promo.effective, s)}
              </span>
              {promo.active && promo.price != null && (
                <span className="text-lg tabular-nums text-earth line-through decoration-1">
                  {formatPrice(promo.price, s)}
                </span>
              )}
            </div>
          )}

          {product.short_description && (
            <p className="mt-6 max-w-[60ch] text-lg leading-relaxed text-ink">
              {product.short_description}
            </p>
          )}

          {product.description && (
            <div className="mt-4 max-w-[65ch] space-y-4 leading-relaxed text-ink-soft">
              {product.description.split(/\n{2,}/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}

          {wa && (
            <a
              href={`https://wa.me/${wa}?text=${encodeURIComponent(
                `Hola! Me interesa ${product.name} — ${shareUrl}`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex w-fit items-center rounded-pill bg-primary px-6 py-3 text-sm font-medium text-on-dark transition-opacity hover:opacity-90"
            >
              Consultar por WhatsApp
            </a>
          )}
          <AddToOrder
            className="mt-4"
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              detail:
                [product.scientific_name, product.attributes?.envase]
                  .filter(Boolean)
                  .join(' · ') || null,
            }}
          />
        </div>
      </div>

      {/* El mismo cartel de referencias que esta en el local */}
      <AttributeReferences definitions={definitions} attributes={product.attributes} />

      {/* La etiqueta que el cliente acaba de escanear: en el azul de la carteleria */}
      <section className="mt-14 flex flex-wrap items-center gap-6 rounded-card bg-secondary px-7 py-7 text-on-dark">
        <div className="rounded-sm bg-on-dark p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/qr?slug=${encodeURIComponent(product.slug)}&size=256`}
            alt={`Código QR de ${product.name}`}
            width={96}
            height={96}
          />
        </div>
        <div className="min-w-56 flex-1">
          <p className="caption text-[0.65rem] opacity-70">La etiqueta de esta planta</p>
          <p className="mt-2 max-w-[46ch] text-sm leading-relaxed">
            Escaneá el código y llegás siempre a esta ficha, con el precio y los cuidados
            actualizados.
          </p>
        </div>
      </section>

      {siblings.length > 0 && (
        <section className="mt-24">
          <div className="band mb-5 px-7 py-3.5">
            <h2 className="font-display text-2xl leading-none">
              También en {trail[trail.length - 1]?.name ?? 'el vivero'}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {siblings.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                settings={s}
                definitions={definitions}
                iconByCategory={iconByCategory}
              />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
