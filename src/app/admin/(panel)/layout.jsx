import Link from 'next/link';
import { requireAdminContext } from '@/lib/auth';
import AdminNav from '@/components/admin/AdminNav';

export const metadata = { title: 'Panel' };

export default async function PanelLayout({ children }) {
  const { tenant, user, role } = await requireAdminContext();

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[16rem_1fr]">
      <aside className="no-print border-b border-line bg-surface md:sticky md:top-0 md:h-dvh md:border-b-0 md:border-r">
        <div className="flex h-full flex-col p-5">
          <Link href="/admin" className="block">
            <p className="font-display text-2xl leading-tight text-ink">{tenant.name}</p>
            <p className="mt-0.5 text-xs text-ink-soft">{tenant.host || tenant.slug}</p>
          </Link>

          <div className="mt-7 flex-1">
            <AdminNav role={role} />
          </div>

          <p className="mt-6 truncate text-xs text-ink-soft" title={user.email}>
            {user.email} · {role}
          </p>
        </div>
      </aside>

      <div className="min-w-0 bg-card">
        <div className="mx-auto max-w-4xl px-6 py-10">{children}</div>
      </div>
    </div>
  );
}
