import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireTenant, tenantUrl } from '@/lib/tenant';
import {
  getAttributeDefinitions,
  getCategoryTree,
  getProductBySlug,
  getProductsInBranch,
} from '@/lib/queries';
import { categoryPath, formatPrice, promoState } from '@/lib/format';
import ProductGallery from '@/components/site/ProductGallery';
import ProductCard from '@/components/site/ProductCard';
import AttributeReferences from '@/components/site/AttributeReferences';
import { PromoBadge } from '@/components/site/PriceTag';

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
        <ProductGallery images={images} name={product.name} />

        <div className="flex flex-col">
          <div className="mb-4">
            <PromoBadge product={product} />
          </div>

          <h1 className="font-display text-[clamp(2.25rem,5vw,3.25rem)] leading-[1.02] text-ink">
            {product.name}
          </h1>

          {product.scientific_name && (
            <p className="binomial mt-2 text-xl">{product.scientific_name}</p>
          )}

          {s.show_prices && promo.effective != null && (
            <div className="mt-6 flex flex-wrap items-baseline gap-3 border-y border-line py-5">
              <span
                className={`font-display text-4xl tabular-nums ${
                  promo.active ? 'text-accent' : 'text-ink'
                }`}
              >
                {formatPrice(promo.effective, s)}
              </span>
              {promo.active && promo.price != null && (
                <span className="text-lg tabular-nums text-ink-soft line-through decoration-1">
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
              className="mt-8 inline-flex w-fit items-center bg-primary px-6 py-3 text-sm font-medium text-on-dark transition-opacity hover:opacity-90"
            >
              Consultar por WhatsApp
            </a>
          )}
        </div>
      </div>

      {/* El mismo cartel de referencias que esta en el local */}
      <AttributeReferences definitions={definitions} attributes={product.attributes} />

      {/* La etiqueta que el cliente acaba de escanear */}
      <section className="mt-14 flex flex-wrap items-center gap-6 border-t border-line pt-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/qr?slug=${encodeURIComponent(product.slug)}&size=256`}
          alt={`Código QR de ${product.name}`}
          width={88}
          height={88}
          className="shrink-0"
        />
        <p className="max-w-[46ch] text-sm leading-relaxed text-ink-soft">
          Este es el código de la etiqueta de {product.name}. Escaneándolo llegás siempre a esta
          ficha, con el precio y los cuidados actualizados.
        </p>
      </section>

      {siblings.length > 0 && (
        <section className="mt-24">
          <h2 className="mb-7 border-b border-line pb-3 font-display text-3xl leading-none text-ink">
            También en {trail[trail.length - 1]?.name ?? 'el vivero'}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {siblings.map((p) => (
              <ProductCard key={p.id} product={p} settings={s} definitions={definitions} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
