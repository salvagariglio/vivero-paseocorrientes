import Link from 'next/link';
import { requireAdminContext } from '@/lib/auth';
import { adminQuotes } from '@/lib/admin-queries';
import { formatPrice } from '@/lib/format';
import { calculateQuote, quoteLabel, isRequest, statusLabel } from '@/lib/quote';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Presupuestos' };

const TONE = {
  solicitud: 'border-accent/40 text-accent',
  borrador: 'border-line text-ink-soft',
  enviado: 'border-secondary/40 text-secondary',
  aceptado: 'border-primary/40 text-primary',
  rechazado: 'border-accent/40 text-accent',
  vencido: 'border-line text-earth',
};

export default async function QuotesPage() {
  const { tenant, supabase } = await requireAdminContext();
  const quotes = await adminQuotes(supabase, tenant.id);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl leading-none text-ink">Presupuestos</h1>
          <p className="mt-2 max-w-[60ch] text-sm text-ink-soft">
            Los precios quedan congelados al guardarlo: si después cambia la lista, el presupuesto
            que ya mandaste sigue diciendo lo mismo.
          </p>
        </div>
        <Link
          href="/admin/presupuestos/nuevo"
          className="rounded-pill bg-primary px-5 py-2.5 text-sm font-medium text-on-dark hover:opacity-90"
        >
          Nuevo presupuesto
        </Link>
      </div>

      {quotes.length === 0 ? (
        <div className="mt-10 rounded-card border border-dashed border-line p-12 text-center">
          <p className="font-display text-2xl text-ink">Todavía no armaste ninguno</p>
          <p className="mt-2 text-sm text-ink-soft">
            Buscás las plantas en el catálogo, ponés cantidades y sale el total.
          </p>
          <Link
            href="/admin/presupuestos/nuevo"
            className="mt-6 inline-block rounded-pill bg-primary px-5 py-2.5 text-sm font-medium text-on-dark"
          >
            Armar el primero
          </Link>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-line rounded-card border border-line bg-card">
          {quotes.map((quote) => {
            const totals = calculateQuote(quote.items ?? [], {
              discountPct: quote.discount_pct,
              paymentAdjustPct: quote.payment_adjust_pct,
            });
            return (
              <li key={quote.id}>
                <Link
                  href={`/admin/presupuestos/${quote.id}`}
                  className="flex flex-wrap items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface"
                >
                  <span
                    className={`w-24 shrink-0 font-display leading-none text-primary-deep ${
                      isRequest(quote) ? 'text-sm' : 'text-lg tabular-nums'
                    }`}
                  >
                    {quoteLabel(quote)}
                  </span>

                  <span className="min-w-40 flex-1">
                    <span className="block truncate text-sm text-ink">
                      {quote.customer_name || 'Sin nombre'}
                    </span>
                    <span className="block text-xs text-ink-soft">
                      {new Date(quote.created_at).toLocaleDateString('es-AR')} · {totals.items}{' '}
                      {totals.items === 1 ? 'ítem' : 'ítems'}
                    </span>
                  </span>

                  <span
                    className={`shrink-0 rounded-pill border px-3 py-1 text-[0.65rem] ${
                      TONE[quote.status] ?? TONE.borrador
                    }`}
                  >
                    {statusLabel(quote.status)}
                  </span>

                  <span className="w-28 shrink-0 text-right text-sm font-medium tabular-nums text-ink">
                    {isRequest(quote) ? (
                      <span className="text-earth">Sin cotizar</span>
                    ) : (
                      formatPrice(totals.total, tenant.settings)
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
