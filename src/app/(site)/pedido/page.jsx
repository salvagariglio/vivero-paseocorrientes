import { requireTenant } from '@/lib/tenant';
import OrderForm from '@/components/site/OrderForm';

export const metadata = { title: 'Pedir presupuesto' };

export default async function OrderPage() {
  const tenant = await requireTenant();
  const s = tenant.settings ?? {};
  const whatsapp = s.whatsapp ? String(s.whatsapp).replace(/\D/g, '') : null;

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="font-display text-[clamp(2.25rem,5vw,3.25rem)] leading-none text-primary-deep">
        Pedir presupuesto
      </h1>
      <div className="mt-4 h-0.5 w-14 rounded-pill bg-accent" />

      <p className="mt-5 max-w-[58ch] leading-relaxed text-earth">
        Armá la lista con lo que necesitás y las cantidades. Lo revisamos, vemos
        disponibilidad y te pasamos el precio final: por volumen o por temporada suele
        cambiar respecto de la lista.
      </p>

      <div className="mt-10">
        <OrderForm whatsapp={whatsapp} />
      </div>
    </div>
  );
}
