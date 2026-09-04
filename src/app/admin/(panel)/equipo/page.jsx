import { requireRole } from '@/lib/auth';
import { updateMemberRole, removeMember, cancelInvite } from '@/app/admin/actions';
import InviteForm from '@/components/admin/InviteForm';
import RoleSelect from '@/components/admin/RoleSelect';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Equipo' };

const ROLE_LABEL = { owner: 'Dueno', admin: 'Administrador', editor: 'Editor' };

export default async function TeamPage() {
  const { tenant, supabase, user } = await requireRole('admin');

  const [{ data: members }, { data: invites }] = await Promise.all([
    supabase.rpc('tenant_members', { p_tenant: tenant.id }),
    supabase
      .from('tenant_invites')
      .select('id, email, role, accepted_at, created_at')
      .eq('tenant_id', tenant.id)
      .is('accepted_at', null)
      .order('created_at', { ascending: false }),
  ]);

  return (
    <div>
      <h1 className="font-display text-4xl leading-none text-ink">Equipo</h1>
      <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-ink-soft">
        El editor carga y edita plantas. El administrador ademas maneja dominios y equipo. El dueno
        no se puede quitar.
      </p>

      <ul className="mt-8 divide-y divide-line rounded-card border border-line bg-card">
        {(members ?? []).map((m) => (
          <li key={m.user_id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <span className="min-w-0 flex-1 truncate text-sm text-ink">{m.email}</span>

            {m.role === 'owner' || m.user_id === user.id ? (
              <span className="text-xs text-ink-soft">{ROLE_LABEL[m.role]}</span>
            ) : (
              <>
                <form action={updateMemberRole}>
                  <input type="hidden" name="user_id" value={m.user_id} />
                  <RoleSelect defaultValue={m.role} />
                </form>
                <form action={removeMember}>
                  <input type="hidden" name="user_id" value={m.user_id} />
                  <button type="submit" className="px-2 py-1 text-xs text-ink-soft hover:text-accent">
                    Quitar
                  </button>
                </form>
              </>
            )}
          </li>
        ))}
      </ul>

      <InviteForm />

      {(invites ?? []).length > 0 && (
        <section className="mt-12 border-t border-line pt-8">
          <h2 className="font-display text-2xl leading-none text-ink">Invitaciones pendientes</h2>
          <ul className="mt-5 divide-y divide-line rounded-card border border-line bg-card">
            {invites.map((i) => (
              <li key={i.id} className="flex items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1 truncate text-sm text-ink">{i.email}</span>
                <span className="text-xs text-ink-soft">{ROLE_LABEL[i.role]}</span>
                <form action={cancelInvite}>
                  <input type="hidden" name="id" value={i.id} />
                  <button type="submit" className="px-2 py-1 text-xs text-ink-soft hover:text-accent">
                    Cancelar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
