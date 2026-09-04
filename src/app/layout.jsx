import { getTenant } from '@/lib/tenant';
import { themeVars } from '@/lib/theme';
import { typesetVars } from '@/lib/fonts';
import './globals.css';

export async function generateMetadata() {
  const tenant = await getTenant();
  if (!tenant) return { title: 'Vivero' };

  const s = tenant.settings;
  return {
    title: { default: tenant.name, template: `%s · ${tenant.name}` },
    description: s.tagline || s.about || `Catalogo de plantas de ${tenant.name}`,
    icons: s.favicon_url ? { icon: s.favicon_url } : undefined,
    openGraph: {
      title: tenant.name,
      description: s.tagline || '',
      images: s.cover_url ? [s.cover_url] : undefined,
    },
  };
}

export default async function RootLayout({ children }) {
  const tenant = await getTenant();
  const s = tenant?.settings ?? {};

  const style = { ...themeVars(s.theme), ...typesetVars(s.typeset) };

  return (
    <html
      lang={(s.locale || 'es-AR').slice(0, 2)}
      style={style}
      suppressHydrationWarning
    >
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
