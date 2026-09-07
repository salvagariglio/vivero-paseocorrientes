import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Printer } from 'lucide-react';
import { requireAdminContext } from '@/lib/auth';
import { adminPaymentMethods, adminPriceList, adminQuote } from '@/lib/admin-queries';
import { deleteQuote } from '@/app/admin/actions';
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
          Presupuesto #{quote.number}
        </h1>
        <Link
          href={`/admin/presupuestos/${quote.id}/imprimir`}
          className="inline-flex items-center gap-2 rounded-pill border border-primary/30 px-5 py-2.5 text-sm font-medium text-primary-deep transition-colors hover:border-primary"
        >
          <Printer size={16} strokeWidth={1.75} />
          Ver la hoja
        </Link>
      </div>

      {guardado && (
        <p
          role="status"
          className="mt-5 rounded-card border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary"
        >
          Guardado.
        </p>
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
