import Link from 'next/link';
import { requireAdminContext } from '@/lib/auth';
import { adminCategoryTree } from '@/lib/admin-queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Categorias' };

function Branch({ node, depth = 0 }) {
  return (
    <li>
      <Link
        href={`/admin/categorias/${node.id}`}
        className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 transition-colors hover:bg-surface"
        style={{ paddingLeft: `${1 + depth * 1.5}rem` }}
      >
        <span className={depth === 0 ? 'font-medium text-ink' : 'text-ink-soft'}>{node.name}</span>
        <span className="shrink-0 text-xs text-ink-soft">
          {node.is_active ? '' : 'oculta · '}
          {node.children.length > 0 && `${node.children.length} sub`}
        </span>
      </Link>
      {node.children.length > 0 && (
        <ul>
          {node.children.map((child) => (
            <Branch key={child.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default async function CategoriesPage() {
  const { tenant, supabase } = await requireAdminContext();
  const tree = await adminCategoryTree(supabase, tenant.id);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl leading-none text-ink">Categorias</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Este es el menu del catalogo. Una categoria puede tener subcategorias o plantas directo.
          </p>
        </div>
        <Link
          href="/admin/categorias/nueva"
          className="bg-primary px-5 py-2.5 text-sm font-medium text-on-dark hover:opacity-90"
        >
          Nueva categoria
        </Link>
      </div>

      {tree.length === 0 ? (
        <div className="mt-8 border border-dashed border-line p-12 text-center">
          <p className="font-display text-2xl text-ink">El menu esta vacio</p>
          <p className="mt-2 text-sm text-ink-soft">
            Crea la primera categoria para empezar a ordenar el catalogo.
          </p>
        </div>
      ) : (
        <ul className="mt-8 border border-line border-b-0 bg-white">
          {tree.map((node) => (
            <Branch key={node.id} node={node} />
          ))}
        </ul>
      )}
    </div>
  );
}
