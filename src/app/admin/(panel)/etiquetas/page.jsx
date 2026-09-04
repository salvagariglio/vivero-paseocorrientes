import { requireAdminContext } from '@/lib/auth';
import { adminAttributeDefinitions, adminLabelTemplates } from '@/lib/admin-queries';
import { tenantOrigin } from '@/lib/tenant';
import LabelStudio from '@/components/admin/LabelStudio';
import LabelTemplateForm from '@/components/admin/LabelTemplateForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Etiquetas y QR' };

export default async function LabelsPage() {
  const { tenant, supabase } = await requireAdminContext();

  const [{ data: products }, templates, definitions] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, slug, scientific_name, short_description, price, promo_price, promo_starts_at, promo_ends_at, attributes')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .order('name', { ascending: true }),
    adminLabelTemplates(supabase, tenant.id),
    adminAttributeDefinitions(supabase, tenant.id),
  ]);

  return (
    <div>
      <div className="no-print">
        <h1 className="font-display text-4xl leading-none text-ink">Etiquetas y QR</h1>
        <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-ink-soft">
          Cada etiqueta lleva el nombre de la planta y su QR. El QR apunta a{' '}
          {tenantOrigin(tenant).replace(/^https?:\/\//, '')}/planta/… asi que si despues cambias el
          precio o la descripcion, la etiqueta impresa sigue sirviendo.
        </p>
      </div>

      <div className="mt-8">
        <LabelStudio
          tenant={tenant}
          products={products ?? []}
          templates={templates}
          definitions={definitions}
        />
      </div>

      <section className="no-print mt-16 border-t border-line pt-8">
        <h2 className="font-display text-2xl leading-none text-ink">Plantillas</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Medidas del papel que usas. Podes tener varias y elegir al imprimir.
        </p>

        <div className="mt-6 space-y-8">
          {templates.map((t) => (
            <LabelTemplateForm key={t.id} template={t} />
          ))}
          <LabelTemplateForm template={null} />
        </div>
      </section>
    </div>
  );
}
