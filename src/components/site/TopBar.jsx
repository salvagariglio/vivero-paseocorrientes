import Link from 'next/link';
import { Search } from 'lucide-react';
import CatalogDrawer from './CatalogDrawer';

export default function TopBar({ tenant, tree }) {
  const s = tenant.settings ?? {};

  const footerLinks = [
    s.whatsapp && {
      href: `https://wa.me/${String(s.whatsapp).replace(/\D/g, '')}`,
      label: 'Escribinos por WhatsApp',
      external: true,
    },
    s.instagram && {
      href: `https://instagram.com/${String(s.instagram).replace(/^@/, '')}`,
      label: `Instagram @${String(s.instagram).replace(/^@/, '')}`,
      external: true,
    },
    s.maps_url && { href: s.maps_url, label: 'Cómo llegar', external: true },
  ].filter(Boolean);

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          {s.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={s.logo_url}
              alt={tenant.name}
              width={200}
              height={34}
              className="h-8 w-auto object-contain md:h-9"
            />
          ) : (
            <span className="truncate font-display text-2xl leading-none text-primary-deep">
              {tenant.name}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/buscar"
            className="rounded-full p-2.5 text-ink hover:bg-black/5 transition-colors"
            aria-label="Buscar plantas"
          >
            <Search size={19} strokeWidth={1.75} />
          </Link>
          <CatalogDrawer tree={tree} tenantName={tenant.name} footerLinks={footerLinks} />
        </div>
      </div>
    </header>
  );
}
