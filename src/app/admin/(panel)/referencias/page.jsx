import { requireAdminContext } from '@/lib/auth';
import { adminAttributeDefinitions } from '@/lib/admin-queries';
import AttributeDefinitionCard from '@/components/admin/AttributeDefinitionCard';
import NewAttributeDefinition from '@/components/admin/NewAttributeDefinition';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Referencias' };

export default async function ReferencesPage() {
  const { tenant, supabase } = await requireAdminContext();
  const definitions = await adminAttributeDefinitions(supabase, tenant.id);

  return (
    <div>
      <h1 className="font-display text-4xl leading-none text-ink">Referencias</h1>
      <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-ink-soft">
        Son los datos que se cargan en cada planta: riego, ubicacion, sol, floracion. La ficha
        muestra la escala completa y marca la opcion que corresponde, igual que el cartel del local.
      </p>

      <div className="mt-8 space-y-4">
        {definitions.map((definition) => (
          <AttributeDefinitionCard key={definition.id} definition={definition} />
        ))}
      </div>

      <div className="mt-8">
        <NewAttributeDefinition />
      </div>
    </div>
  );
}
