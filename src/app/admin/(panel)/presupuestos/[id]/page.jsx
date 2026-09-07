import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Printer } from 'lucide-react';
import { requireAdminContext } from '@/lib/auth';
import { adminPaymentMethods, adminPriceList, adminQuote } from '@/lib/admin-queries';
import { deleteQuote, promoteQuote } from '@/app/admin/actions';
import { isRequest, quoteLabel } from '@/lib/quote';
import QuoteBuilder from '@/components/admin/QuoteBuilder';

export const dynamic = 'force-dynamic';

export default async function EditQuotePage({ params, searchParams }) {
  const { id } = await params;
  const { guardado } = await searchParams;
  const { tenant, supabase } = await requireAdminContext();

  const [quote, catalog, paymentMethods] = await Promise.all([
    adminQuote(supabase, tenant.id, id),
    adminPriceList(supabase, tenant.id),
    adminPaymentMethods(supabase, tenant.id),
  ]);

  if (!quote) notFound();

  return (
    <div>
      <Link href="/admin/presupuestos" className="text-sm text-ink-soft hover:text-primary">
        &larr; Presupuestos
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl leading-none text-ink">
          {isRequest(quote) ? 'Consulta del sitio' : `Presupuesto ${quoteLabel(quote)}`}
        </h1>
        {!isRequest(quote) && (
        <Link
          href={`/admin/presupuestos/${quote.id}/imprimir`}
          className="inline-flex items-center gap-2 rounded-pill border border-primary/30 px-5 py-2.5 text-sm font-medium text-primary-deep transition-colors hover:border-primary"
        >
          <Printer size={16} strokeWidth={1.75} />
          Ver la hoja
        </Link>
        )}
      </div>

      {guardado && (
        <p
          role="status"
          className="mt-5 rounded-card border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary"
        >
          Guardado.
        </p>
      )}

      {isRequest(quote) && (
        <section className="mt-6 rounded-card border border-accent/30 bg-accent/5 p-5">
          <p className="caption text-[0.65rem] text-accent">Entró desde el sitio</p>
          <p className="mt-2 text-sm text-ink">
            {quote.customer_name} · {quote.customer_phone}
            {quote.customer_email ? ` · ${quote.customer_email}` : ''}
          </p>
          {quote.customer_message && (
            <p className="mt-2 max-w-[70ch] whitespace-pre-line text-sm leading-relaxed text-ink-soft">
              “{quote.customer_message}”
            </p>
          )}
          <p className="mt-3 max-w-[70ch] text-sm leading-relaxed text-ink-soft">
            El cliente escribió lo que necesita; no vio ningún precio. Armá el presupuesto
            con el buscador de acá abajo y convertilo: recién ahí toma número.
          </p>

          <form action={promoteQuote} className="mt-4">
            <input type="hidden" name="id" value={quote.id} />
            <button
              type="submit"
              className="rounded-pill bg-primary px-5 py-2.5 text-sm font-medium text-on-dark hover:opacity-90"
            >
              Convertir en presupuesto
            </button>
          </form>
        </section>
      )}

      <div className="mt-8">
        <QuoteBuilder
          quote={quote}
          catalog={catalog}
          paymentMethods={paymentMethods}
          settings={tenant.settings}
        />
      </div>

      <form action={deleteQuote} className="mt-10 border-t border-line pt-6">
        <input type="hidden" name="id" value={quote.id} />
        <button
          type="submit"
          className="rounded-pill border border-accent px-5 py-2.5 text-sm text-accent transition-colors hover:bg-accent hover:text-on-dark"
        >
          Eliminar presupuesto
        </button>
      </form>
    </div>
  );
}
