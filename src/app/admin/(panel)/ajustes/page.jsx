import { requireAdminContext } from '@/lib/auth';
import { can } from '@/lib/auth';
import { setPrimaryDomain, deleteDomain } from '@/app/admin/actions';
import SettingsForm from '@/components/admin/SettingsForm';
import DomainForm from '@/components/admin/DomainForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Marca y datos' };

export default async function SettingsPage() {
  const { tenant, supabase, role } = await requireAdminContext();

  const { data: domains } = await supabase
    .from('tenant_domains')
    .select('id, host, is_primary')
    .eq('tenant_id', tenant.id)
    .order('is_primary', { ascending: false })
    .order('host', { ascending: true });

  return (
    <div>
      <h1 className="font-display text-4xl leading-none text-ink">Marca y datos</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Todo lo que ve el cliente en el catalogo y en las etiquetas sale de aca.
      </p>

      <div className="mt-8">
        <SettingsForm tenant={tenant} />
      </div>

      {can(role, 'admin') && (
        <section className="mt-16 border-t border-line pt-8">
          <h2 className="font-display text-2xl leading-none text-ink">Direcciones web</h2>
          <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-ink-soft">
            La direccion principal es la que se codifica en los QR. Si la cambias despues de
            imprimir, las etiquetas viejas siguen funcionando mientras el dominio anterior siga en
            esta lista.
          </p>

          <ul className="mt-6 divide-y divide-line rounded-card border border-line bg-card">
            {(domains ?? []).map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1 truncate text-sm text-ink">{d.host}</span>

                {d.is_primary ? (
                  <span className="border border-primary/40 px-2.5 py-1 text-xs text-primary">
                    Principal
                  </span>
                ) : (
                  <>
                    <form action={setPrimaryDomain}>
                      <input type="hidden" name="id" value={d.id} />
                      <button
                        type="submit"
                        className="border border-line px-2.5 py-1 text-xs text-ink-soft hover:border-primary hover:text-primary"
                      >
                        Hacer principal
                      </button>
                    </form>
                    <form action={deleteDomain}>
                      <input type="hidden" name="id" value={d.id} />
                      <button
                        type="submit"
                        className="px-2 py-1 text-xs text-ink-soft hover:text-accent"
                      >
                        Quitar
                      </button>
                    </form>
                  </>
                )}
              </li>
            ))}
            {(domains ?? []).length === 0 && (
              <li className="px-4 py-6 text-sm text-ink-soft">Todavia no hay dominios.</li>
            )}
          </ul>

          <DomainForm />
        </section>
      )}
    </div>
  );
}
