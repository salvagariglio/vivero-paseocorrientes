import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdminContext } from '@/lib/auth';
import { adminCategoryTree, adminProduct, flattenTree, adminAttributeDefinitions } from '@/lib/admin-queries';
import { tenantOrigin } from '@/lib/tenant';
import ProductForm from '@/components/admin/ProductForm';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }) {
  const { id } = await params;
  const { tenant, supabase } = await requireAdminContext();

  const [product, tree, definitions] = await Promise.all([
    adminProduct(supabase, tenant.id, id),
    adminCategoryTree(supabase, tenant.id),
    adminAttributeDefinitions(supabase, tenant.id),
  ]);

  if (!product) notFound();

  const url = `${tenantOrigin(tenant)}/planta/${product.slug}`;

  return (
    <div>
      <Link href="/admin/productos" className="text-sm text-ink-soft hover:text-primary">
        &larr; Plantas
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <h1 className="font-display text-4xl leading-none text-ink">{product.name}</h1>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 block truncate text-sm text-primary underline underline-offset-4"
          >
            {url.replace(/^https?:\/\//, '')}
          </a>
        </div>

        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/qr?slug=${encodeURIComponent(product.slug)}&size=256`}
            alt={`QR de ${product.name}`}
            width={72}
            height={72}
            className="size-18 border border-line bg-white p-1"
          />
          <a
            href={`/api/qr?slug=${encodeURIComponent(product.slug)}&size=1024`}
            download={`qr-${product.slug}.png`}
            className="text-sm text-primary underline underline-offset-4"
          >
            Descargar QR
          </a>
        </div>
      </div>

      <div className="mt-8">
        <ProductForm
          product={product}
          categoryOptions={flattenTree(tree)}
          definitions={definitions}
          tenantId={tenant.id}
        />
      </div>
    </div>
  );
}
