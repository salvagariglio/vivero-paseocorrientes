import Link from 'next/link';
import { requireAdminContext } from '@/lib/auth';
import { adminCategoryTree, flattenTree } from '@/lib/admin-queries';
import CategoryForm from '@/components/admin/CategoryForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Nueva categoria' };

export default async function NewCategoryPage() {
  const { tenant, supabase } = await requireAdminContext();
  const tree = await adminCategoryTree(supabase, tenant.id);

  return (
    <div>
      <Link href="/admin/categorias" className="text-sm text-ink-soft hover:text-primary">
        &larr; Categorias
      </Link>
      <h1 className="mt-3 font-display text-4xl leading-none text-ink">Nueva categoria</h1>

      <div className="mt-8">
        <CategoryForm category={null} categoryOptions={flattenTree(tree)} tenantId={tenant.id} />
      </div>
    </div>
  );
}
