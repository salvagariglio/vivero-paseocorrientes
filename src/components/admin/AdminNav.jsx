'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Leaf, FolderTree, Tags, Palette, Users, Ruler, ExternalLink, LogOut, Calculator, FileSpreadsheet } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const ITEMS = [
  { href: '/admin/productos', label: 'Plantas', icon: Leaf },
  { href: '/admin/categorias', label: 'Categorías', icon: FolderTree },
  { href: '/admin/precios', label: 'Lista de precios', icon: FileSpreadsheet },
  { href: '/admin/presupuestos', label: 'Presupuestos', icon: Calculator },
  { href: '/admin/referencias', label: 'Referencias', icon: Ruler },
  { href: '/admin/etiquetas', label: 'Etiquetas y QR', icon: Tags },
  { href: '/admin/ajustes', label: 'Marca y datos', icon: Palette },
  { href: '/admin/equipo', label: 'Equipo', icon: Users, minRole: 'admin' },
];

const RANK = { editor: 1, admin: 2, owner: 3 };

export default function AdminNav({ role }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.replace('/admin/login');
    router.refresh();
  }

  const visible = ITEMS.filter(
    (item) => !item.minRole || (RANK[role] ?? 0) >= RANK[item.minRole]
  );

  return (
    <nav className="flex flex-col gap-1">
      {visible.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
              active ? 'bg-primary text-on-dark' : 'text-ink-soft hover:bg-black/5 hover:text-ink'
            }`}
          >
            <Icon size={17} strokeWidth={1.75} />
            {label}
          </Link>
        );
      })}

      <div className="mt-4 border-t border-line pt-4">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-ink-soft hover:text-ink"
        >
          <ExternalLink size={17} strokeWidth={1.75} />
          Ver el sitio
        </Link>
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-ink-soft hover:text-ink"
        >
          <LogOut size={17} strokeWidth={1.75} />
          Salir
        </button>
      </div>
    </nav>
  );
}
