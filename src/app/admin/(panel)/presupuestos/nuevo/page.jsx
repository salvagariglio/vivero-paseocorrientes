import Link from 'next/link';
import { requireAdminContext } from '@/lib/auth';
import { adminPaymentMethods, adminPriceList } from '@/lib/admin-queries';
import QuoteBuilder from '@/components/admin/QuoteBuilder';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Nuevo presupuesto' };

export default async function NewQuotePage() {
  const { tenant, supabase } = await requireAdminContext();

  const [catalog, paymentMethods] = await Promise.all([
    adminPriceList(supabase, tenant.id),
    adminPaymentMethods(supabase, tenant.id),
  ]);

  return (
    <div>
      <Link href="/admin/presupuestos" className="text-sm text-ink-soft hover:text-primary">
        &larr; Presupuestos
      </Link>
      <h1 className="mt-3 font-display text-4xl leading-none text-ink">Nuevo presupuesto</h1>

      <div className="mt-8">
        <QuoteBuilder
          quote={null}
          catalog={catalog}
          paymentMethods={paymentMethods}
          settings={tenant.settings}
        />
      </div>
    </div>
  );
}
