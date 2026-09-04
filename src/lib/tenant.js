import { cache } from 'react';
import { headers } from 'next/headers';
import { unstable_cache } from 'next/cache';
import { createSupabasePublicClient } from '@/lib/supabase/server';
import { DEV_TENANT_SLUG, PLATFORM_HOSTS, ROOT_DOMAIN } from '@/lib/config';

const rootHost = ROOT_DOMAIN.split(':')[0];

export function normalizeHost(host) {
  if (!host) return '';
  return host.toLowerCase().trim().split(':')[0].replace(/\.$/, '');
}

/** Devuelve el subdominio si el host cuelga del dominio raiz de la plataforma. */
export function subdomainOf(host) {
  const h = normalizeHost(host);
  if (!h || h === rootHost) return null;
  if (!h.endsWith(`.${rootHost}`)) return null;
  const sub = h.slice(0, -(rootHost.length + 1));
  if (!sub || sub === 'www') return null;
  return sub.split('.').pop() || null;
}

export function isPlatformHost(host) {
  const h = normalizeHost(host);
  return h === rootHost || h === `www.${rootHost}` || PLATFORM_HOSTS.includes(h);
}

const loadByHost = unstable_cache(
  async (host) => {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase.rpc('resolve_tenant', { p_host: host });
    if (error) throw error;
    return data?.[0] ?? null;
  },
  ['tenant-by-host'],
  { revalidate: 60, tags: ['tenants'] }
);

const loadBySlug = unstable_cache(
  async (slug) => {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase.rpc('resolve_tenant_by_slug', { p_slug: slug });
    if (error) throw error;
    return data?.[0] ?? null;
  },
  ['tenant-by-slug'],
  { revalidate: 60, tags: ['tenants'] }
);

/** Tenant del request actual, o null. Memoizado por request. */
export const getTenant = cache(async () => {
  const h = await headers();
  const host = normalizeHost(h.get('x-forwarded-host') || h.get('host'));

  if (host) {
    const byHost = await loadByHost(host);
    if (byHost) return withDefaults(byHost);

    const sub = subdomainOf(host);
    if (sub) {
      const bySlug = await loadBySlug(sub);
      if (bySlug) return withDefaults(bySlug);
    }
  }

  if (DEV_TENANT_SLUG) {
    const dev = await loadBySlug(DEV_TENANT_SLUG);
    if (dev) return withDefaults(dev);
  }

  return null;
});

/** Igual que getTenant pero lanza 404 si no resuelve. */
export async function requireTenant() {
  const tenant = await getTenant();
  if (!tenant) {
    const { notFound } = await import('next/navigation');
    notFound();
  }
  return tenant;
}

const SETTINGS_DEFAULTS = {
  typeset: 'fraunces-archivo',
  currency: 'ARS',
  locale: 'es-AR',
  show_prices: true,
};

function withDefaults(tenant) {
  return { ...tenant, settings: { ...SETTINGS_DEFAULTS, ...(tenant.settings || {}) } };
}

/** URL publica absoluta del tenant (la que codifican los QR). */
export function tenantOrigin(tenant) {
  const host = tenant?.host || (tenant?.slug ? `${tenant.slug}.${ROOT_DOMAIN}` : ROOT_DOMAIN);
  const isLocal = host.startsWith('localhost') || host.endsWith('.localhost') || host.startsWith('127.');
  const withPort = isLocal && !host.includes(':') && ROOT_DOMAIN.includes(':')
    ? `${host}:${ROOT_DOMAIN.split(':')[1]}`
    : host;
  return `${isLocal ? 'http' : 'https'}://${withPort}`;
}

export function tenantUrl(tenant, path = '/') {
  return `${tenantOrigin(tenant)}${path.startsWith('/') ? path : `/${path}`}`;
}
