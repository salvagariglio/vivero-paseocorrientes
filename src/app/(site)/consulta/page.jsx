import { requireTenant } from '@/lib/tenant';
import ConsultaForm from '@/components/site/ConsultaForm';

export const metadata = { title: 'Pedir presupuesto' };

export default async function ConsultaPage({ searchParams }) {
  const { planta } = await searchParams;
  const tenant = await requireTenant();
  const s = tenant.settings ?? {};
  const whatsapp = s.whatsapp ? String(s.whatsapp).replace(/\D/g, '') : null;

  // Si llegó desde una ficha, el mensaje arranca nombrando esa planta.
  const sugerencia = planta ? `Me interesa ${String(planta).slice(0, 120)}. ` : null;

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="font-display text-[clamp(2.25rem,5vw,3.25rem)] leading-none text-primary-deep">
        Pedir presupuesto
      </h1>
      <div className="mt-4 h-0.5 w-14 rounded-pill bg-accent" />

      <p className="mt-5 max-w-[58ch] leading-relaxed text-earth">
        Escribinos qué necesitás y te armamos el presupuesto. Los precios del catálogo son de
        referencia: por cantidad, por temporada o según el envase suelen cambiar, así que
        preferimos pasarte el número real.
      </p>

      <div className="mt-10">
        <ConsultaForm whatsapp={whatsapp} sugerencia={sugerencia} />
      </div>
    </div>
  );
}
