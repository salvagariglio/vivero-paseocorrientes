import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getTenant } from '@/lib/tenant';

export const ROLE_RANK = { editor: 1, admin: 2, owner: 3 };

export function can(role, minimum) {
  return (ROLE_RANK[role] ?? 0) >= (ROLE_RANK[minimum] ?? 99);
}

export const getUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
});

/** Tenants a los que pertenece el usuario logueado. */
export const getMyTenants = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('my_tenants');
  if (error) return [];
  return data ?? [];
});

/**
 * Contexto del panel: usuario + tenant del host + rol.
 * Redirige a login si no hay sesion; a /admin/sin-acceso si no es miembro.
 */
export const requireAdminContext = cache(async () => {
  const tenant = await getTenant();
  const user = await getUser();

  if (!user) {
    redirect('/admin/login');
  }
  if (!tenant) {
    redirect('/admin/sin-vivero');
  }

  const supabase = await createSupabaseServerClient();
  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('tenant_id', tenant.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    redirect('/admin/sin-acceso');
  }

  return { user, tenant, role: membership.role, supabase };
});

/** Igual que requireAdminContext pero exige rol minimo. */
export async function requireRole(minimum) {
  const ctx = await requireAdminContext();
  if (!can(ctx.role, minimum)) redirect('/admin/sin-acceso');
  return ctx;
}
