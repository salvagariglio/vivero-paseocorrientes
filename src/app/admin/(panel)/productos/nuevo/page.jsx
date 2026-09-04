import Link from 'next/link';
import { requireAdminContext } from '@/lib/auth';
import { adminCategoryTree, flattenTree, adminAttributeDefinitions } from '@/lib/admin-queries';
import ProductForm from '@/components/admin/ProductForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Nueva planta' };

export default async function NewProductPage() {
  const { tenant, supabase } = await requireAdminContext();
  const [tree, definitions] = await Promise.all([
    adminCategoryTree(supabase, tenant.id),
    adminAttributeDefinitions(supabase, tenant.id),
  ]);

  return (
    <div>
      <Link href="/admin/productos" className="text-sm text-ink-soft hover:text-primary">
        &larr; Plantas
      </Link>
      <h1 className="mt-3 font-display text-4xl leading-none text-ink">Nueva planta</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Al guardarla queda publicada y su QR ya apunta a la ficha.
      </p>

      <div className="mt-8">
        <ProductForm
          product={null}
          categoryOptions={flattenTree(tree)}
          definitions={definitions}
          tenantId={tenant.id}
        />
      </div>
    </div>
  );
}
