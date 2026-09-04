import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdminContext } from '@/lib/auth';
import { adminCategoryTree, flattenTree } from '@/lib/admin-queries';
import CategoryForm from '@/components/admin/CategoryForm';

export const dynamic = 'force-dynamic';

export default async function EditCategoryPage({ params }) {
  const { id } = await params;
  const { tenant, supabase } = await requireAdminContext();

  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('id', id)
    .maybeSingle();

  if (!category) notFound();

  const tree = await adminCategoryTree(supabase, tenant.id);

  return (
    <div>
      <Link href="/admin/categorias" className="text-sm text-ink-soft hover:text-primary">
        &larr; Categorias
      </Link>
      <h1 className="mt-3 font-display text-4xl leading-none text-ink">{category.name}</h1>

      <div className="mt-8">
        <CategoryForm
          category={category}
          categoryOptions={flattenTree(tree)}
          tenantId={tenant.id}
        />
      </div>
    </div>
  );
}
