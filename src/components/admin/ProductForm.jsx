'use client';

import { useActionState } from 'react';
import { saveProduct, deleteProduct } from '@/app/admin/actions';
import { Field, Input, Textarea, Select, Check, SubmitButton, FormStatus, Fieldset } from './Form';
import ImageUploader from './ImageUploader';
import AttributesEditor from './AttributesEditor';

function toLocalInput(value) {
  if (!value) return '';
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

export default function ProductForm({ product, categoryOptions = [], definitions = [], tenantId }) {
  const [state, formAction] = useActionState(saveProduct, null);
  const p = product ?? {};
  const isNew = !p.id;

  return (
    <div className="space-y-10">
      <form action={formAction} className="space-y-10">
        {p.id && <input type="hidden" name="id" value={p.id} />}

        <div className="space-y-4">
          <Field label="Nombre">
            <Input name="name" defaultValue={p.name ?? ''} required placeholder="Monstera deliciosa" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre científico" hint="Se muestra en itálica bajo el nombre.">
              <Input name="scientific_name" defaultValue={p.scientific_name ?? ''} />
            </Field>

            <Field label="Dirección web" hint="Si lo dejás vacío se arma con el nombre.">
              <Input name="slug" defaultValue={p.slug ?? ''} placeholder="monstera-deliciosa" />
            </Field>
          </div>

          <Field label="Categoría">
            <Select name="category_id" defaultValue={p.category_id ?? ''}>
              <option value="">Sin categoría</option>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {'— '.repeat(c.depth)}
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Descripción corta" hint="Una línea. Aparece arriba de todo en la ficha.">
            <Input
              name="short_description"
              defaultValue={p.short_description ?? ''}
              maxLength={160}
              placeholder="Trepadora de interior, hojas grandes y fenestradas."
            />
          </Field>

          <Field label="Descripción" hint="Separá párrafos con una línea en blanco.">
            <Textarea name="description" rows={6} defaultValue={p.description ?? ''} />
          </Field>
        </div>

        <Fieldset title="Imágenes">
          <ImageUploader
            name="image_url"
            tenantId={tenantId}
            label="Imagen principal"
            hint="Es la que se ve en el catálogo y al compartir el link."
            defaultValue={p.image_url ?? ''}
          />
          <ImageUploader
            name="gallery"
            tenantId={tenantId}
            multiple
            label="Galería"
            hint="Fotos extra de la ficha."
            defaultValue={(p.images ?? []).map((i) => i.url).join('\n')}
          />
        </Fieldset>

        <Fieldset title="Precio y promoción">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Precio">
              <Input name="price" type="number" step="0.01" min="0" defaultValue={p.price ?? ''} />
            </Field>
            <Field label="Precio con promo" hint="Dejalo vacío si no hay promoción.">
              <Input
                name="promo_price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={p.promo_price ?? ''}
              />
            </Field>
          </div>

          <Field label="Texto de la promo" hint="Por defecto se calcula el % de descuento.">
            <Input name="promo_label" defaultValue={p.promo_label ?? ''} placeholder="2x1 en cactus" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="La promo empieza" hint="Opcional.">
              <Input
                name="promo_starts_at"
                type="datetime-local"
                defaultValue={toLocalInput(p.promo_starts_at)}
              />
            </Field>
            <Field label="La promo termina" hint="Opcional. Después vuelve al precio normal.">
              <Input
                name="promo_ends_at"
                type="datetime-local"
                defaultValue={toLocalInput(p.promo_ends_at)}
              />
            </Field>
          </div>
        </Fieldset>

        <Fieldset
          title="Referencias"
          description="Las mismas del cartel del local. Se ven en la ficha y en la etiqueta."
        >
          <AttributesEditor definitions={definitions} defaultValue={p.attributes ?? {}} />
        </Fieldset>

        <Fieldset title="Stock y orden">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Código interno">
              <Input name="sku" defaultValue={p.sku ?? ''} />
            </Field>
            <Field label="Stock">
              <Input name="stock" type="number" min="0" defaultValue={p.stock ?? ''} />
            </Field>
            <Field label="Orden" hint="Menor aparece primero.">
              <Input name="position" type="number" defaultValue={p.position ?? 0} />
            </Field>
          </div>

          <Check
            name="is_active"
            label="Publicada"
            hint="Si la despublicás desaparece del catálogo, pero el QR sigue existiendo."
            defaultChecked={isNew ? true : p.is_active}
          />
          <Check
            name="allow_discount"
            label="Admite descuento"
            hint="Si lo desmarcás, el descuento general de un presupuesto no la toca."
            defaultChecked={isNew ? true : p.allow_discount !== false}
          />
          <Check
            name="is_featured"
            label="Destacada en la portada"
            defaultChecked={p.is_featured ?? false}
          />
        </Fieldset>

        <div className="flex flex-wrap items-center gap-4 border-t border-line pt-6">
          <SubmitButton>{isNew ? 'Crear planta' : 'Guardar cambios'}</SubmitButton>
          <FormStatus state={state} />
        </div>
      </form>

      {p.id && (
        <form action={deleteProduct} className="border-t border-line pt-6">
          <input type="hidden" name="id" value={p.id} />
          <p className="mb-3 text-sm text-ink-soft">
            Eliminar borra la planta y su ficha. Los QR ya impresos dejan de funcionar.
          </p>
          <SubmitButton variant="danger">Eliminar planta</SubmitButton>
        </form>
      )}
    </div>
  );
}
