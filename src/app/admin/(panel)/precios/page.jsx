import { requireAdminContext } from '@/lib/auth';
import { adminPriceImports } from '@/lib/admin-queries';
import PriceImport from '@/components/admin/PriceImport';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Lista de precios' };

const fecha = (value, locale) =>
  new Date(value).toLocaleString(locale || 'es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export default async function PricesPage() {
  const { tenant, supabase } = await requireAdminContext();

  const [imports, { data: members }] = await Promise.all([
    adminPriceImports(supabase, tenant.id),
    supabase.rpc('tenant_members', { p_tenant: tenant.id }),
  ]);

  const email = new Map((members ?? []).map((m) => [m.user_id, m.email]));

  return (
    <div>
      <h1 className="font-display text-4xl leading-none text-ink">Lista de precios</h1>
      <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-ink-soft">
        Subí la misma planilla que usás en el vivero. Antes de tocar nada te mostramos qué cambia:
        cuántos precios suben, cuántos bajan y qué plantas no encontramos. Solo se actualiza el
        precio — las fotos, las promociones y los datos de cuidado quedan como están.
      </p>

      <PriceImport settings={tenant.settings} />

      <section className="mt-14 border-t border-line pt-8">
        <h2 className="rule font-display text-2xl leading-none text-ink">Importaciones</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Cada importación queda guardada con el precio que tenía cada planta. Es el historial de la
          lista.
        </p>

        {imports.length === 0 ? (
          <p className="mt-6 rounded-card border border-dashed border-line p-8 text-center text-sm text-ink-soft">
            Todavía no subiste ninguna lista.
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-line rounded-card border border-line bg-card">
            {imports.map((row) => (
              <li key={row.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 p-4">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-ink">
                    {row.filename || 'Planilla sin nombre'}
                  </span>
                  <span className="block text-xs text-ink-soft">
                    {fecha(row.created_at, tenant.settings?.locale)}
                    {email.get(row.created_by) ? ` · ${email.get(row.created_by)}` : ''}
                  </span>
                </span>
                <span className="text-sm tabular-nums text-ink">
                  {row.rows_changed} {row.rows_changed === 1 ? 'precio' : 'precios'}
                  {row.rows_created > 0 && ` · ${row.rows_created} altas`}
                </span>
                <span className="w-full text-xs tabular-nums text-ink-soft sm:w-auto">
                  {row.rows_up} ↑ · {row.rows_down} ↓ · {row.rows_same} = · {row.rows_total} filas
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
