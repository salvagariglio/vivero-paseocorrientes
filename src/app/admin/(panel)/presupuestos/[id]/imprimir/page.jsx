import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdminContext } from '@/lib/auth';
import { adminQuote } from '@/lib/admin-queries';
import { formatPrice } from '@/lib/format';
import { calculateQuote, lineTotal, validUntil } from '@/lib/quote';
import PrintButton from '@/components/admin/PrintButton';

export const dynamic = 'force-dynamic';

export default async function QuoteSheetPage({ params }) {
  const { id } = await params;
  const { tenant, supabase } = await requireAdminContext();

  const quote = await adminQuote(supabase, tenant.id, id);
  if (!quote) notFound();

  const s = tenant.settings ?? {};
  const money = (n) => formatPrice(n, s) ?? '—';

  const totals = calculateQuote(quote.items, {
    discountPct: quote.discount_pct,
    paymentAdjustPct: quote.payment_adjust_pct,
  });

  const contacto = [
    s.address,
    [s.phone, s.whatsapp].filter(Boolean).join(' · '),
    s.email,
    s.instagram ? `@${String(s.instagram).replace(/^@/, '')}` : null,
  ].filter(Boolean);

  const created = new Date(quote.created_at);
  const expires = validUntil(quote.created_at, quote.valid_days);
  const fecha = (d) => d.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <>
      <div className="no-print mb-8 flex flex-wrap items-center justify-between gap-4">
        <Link
          href={`/admin/presupuestos/${quote.id}`}
          className="text-sm text-ink-soft hover:text-primary"
        >
          &larr; Volver a editar
        </Link>
        <PrintButton>Imprimir o guardar en PDF</PrintButton>
      </div>

      {/* La hoja. En pantalla se ve como papel; al imprimir es la pagina. */}
      <article className="quote-sheet mx-auto max-w-[820px] bg-card p-10 text-ink ring-1 ring-line/60">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-line pb-6">
          <div>
            {s.logo_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={s.logo_url} alt={tenant.name} className="h-10 w-auto object-contain" />
            ) : (
              <p className="font-display text-3xl leading-none text-primary-deep">{tenant.name}</p>
            )}
            <div className="mt-3 h-0.5 w-12 rounded-pill bg-accent" />
          </div>

          <div className="text-right">
            <p className="caption text-[0.65rem] text-earth">Presupuesto</p>
            <p className="font-display text-4xl leading-none text-primary-deep">
              #{quote.number}
            </p>
            <p className="mt-2 text-sm text-earth">{fecha(created)}</p>
            {expires && (
              <p className="text-sm text-earth">Válido hasta el {fecha(expires)}</p>
            )}
          </div>
        </header>

        {(quote.customer_name || quote.customer_phone || quote.customer_email) && (
          <section className="border-b border-line py-5">
            <p className="caption text-[0.65rem] text-earth">Para</p>
            <p className="mt-1.5 font-display text-xl leading-none text-ink">
              {quote.customer_name || 'Consumidor final'}
            </p>
            <p className="mt-1 text-sm text-earth">
              {[quote.customer_phone, quote.customer_email].filter(Boolean).join(' · ')}
            </p>
          </section>
        )}

        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="caption pb-2 text-[0.6rem] font-semibold text-earth">Detalle</th>
              <th className="caption pb-2 text-right text-[0.6rem] font-semibold text-earth">Cant.</th>
              <th className="caption pb-2 text-right text-[0.6rem] font-semibold text-earth">Unitario</th>
              <th className="caption pb-2 text-right text-[0.6rem] font-semibold text-earth">Importe</th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((item) => (
              <tr key={item.id} className="border-b border-line/60 align-top">
                <td className="py-2.5 pr-3">
                  <span className="block text-ink">{item.name}</span>
                  {item.detail && (
                    <span className="block text-xs text-earth">{item.detail}</span>
                  )}
                  {!item.allow_discount && (
                    <span className="block text-[0.65rem] text-earth">Precio firme</span>
                  )}
                </td>
                <td className="py-2.5 text-right tabular-nums">{Number(item.qty)}</td>
                <td className="py-2.5 text-right tabular-nums">{money(item.unit_price)}</td>
                <td className="py-2.5 text-right font-medium tabular-nums">
                  {money(lineTotal(item))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <dl className="w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-earth">Subtotal</dt>
              <dd className="tabular-nums">{money(totals.subtotal)}</dd>
            </div>

            {totals.discountAmount > 0 && (
              <div className="flex justify-between">
                <dt className="text-earth">Descuento {totals.discountPct}%</dt>
                <dd className="tabular-nums text-accent">−{money(totals.discountAmount)}</dd>
              </div>
            )}

            {totals.adjustAmount !== 0 && (
              <div className="flex justify-between">
                <dt className="text-earth">
                  {quote.payment_method_name} {totals.adjustPct > 0 ? '+' : ''}
                  {totals.adjustPct}%
                </dt>
                <dd className="tabular-nums">
                  {totals.adjustAmount < 0 ? '−' : '+'}
                  {money(Math.abs(totals.adjustAmount))}
                </dd>
              </div>
            )}

            <div className="flex items-baseline justify-between border-t border-line pt-2.5">
              <dt className="font-display text-2xl text-primary-deep">Total</dt>
              <dd className="font-display text-2xl tabular-nums text-primary-deep">
                {money(totals.total)}
              </dd>
            </div>

            {quote.payment_method_name && totals.adjustAmount === 0 && (
              <p className="pt-1 text-right text-xs text-earth">
                Forma de pago: {quote.payment_method_name}
              </p>
            )}
          </dl>
        </div>

        {quote.notes && (
          <section className="mt-8 border-t border-line pt-5">
            <p className="caption text-[0.6rem] text-earth">Notas</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink">
              {quote.notes}
            </p>
          </section>
        )}

        <footer className="mt-10 border-t border-line pt-5 text-xs leading-relaxed text-earth">
          <p className="font-medium text-ink">{tenant.name}</p>
          {contacto.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </footer>
      </article>
    </>
  );
}
