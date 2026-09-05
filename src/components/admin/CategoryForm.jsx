'use client';

import { useActionState, useState } from 'react';
import { saveCategory, deleteCategory } from '@/app/admin/actions';
import { Field, Input, Textarea, Select, Check, SubmitButton, FormStatus } from './Form';
import ImageUploader from './ImageUploader';
import CategoryIcon, { CATEGORY_ICON_KEYS } from '@/components/icons/CategoryIcon';

export default function CategoryForm({ category, categoryOptions = [], tenantId }) {
  const [state, formAction] = useActionState(saveCategory, null);
  const c = category ?? {};
  const isNew = !c.id;

  // Una categoria no puede colgar de si misma ni de sus hijas.
  const options = categoryOptions.filter((o) => o.id !== c.id);

  const [parentId, setParentId] = useState(c.parent_id ?? '');
  const [icon, setIcon] = useState(c.icon ?? '');
  const isFamily = !parentId;

  return (
    <div className="space-y-8">
      <form action={formAction} className="space-y-4">
        {c.id && <input type="hidden" name="id" value={c.id} />}

        <Field label="Nombre">
          <Input name="name" required defaultValue={c.name ?? ''} placeholder="Interior" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cuelga de" hint="Dejala sin padre para que sea una categoría principal.">
            <Select
              name="parent_id"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
            >
              <option value="">Categoría principal</option>
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {'— '.repeat(o.depth)}
                  {o.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Dirección web" hint="Si lo dejás vacío se arma con el nombre.">
            <Input name="slug" defaultValue={c.slug ?? ''} placeholder="interior" />
          </Field>
        </div>

        <Field label="Descripción" hint="Se muestra arriba del listado de la categoría.">
          <Textarea name="description" rows={3} defaultValue={c.description ?? ''} />
        </Field>

        <ImageUploader
          name="image_url"
          tenantId={tenantId}
          folder="categorias"
          label="Imagen"
          defaultValue={c.image_url ?? ''}
        />

        {isFamily && (
          <div>
            <span className="text-sm font-medium text-ink">Dibujo</span>
            <span className="mt-0.5 block text-xs text-ink-soft">
              Se ve en la portada. Solo las familias llevan dibujo; las subcategorías se
              distinguen por su nombre.
            </span>
            <input type="hidden" name="icon" value={icon} />

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIcon('')}
                aria-pressed={icon === ''}
                className={`flex size-16 items-center justify-center rounded-card border text-xs transition-colors ${
                  icon === '' ? 'border-primary bg-primary/10 text-ink' : 'border-line text-ink-soft'
                }`}
              >
                Sin dibujo
              </button>

              {CATEGORY_ICON_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIcon(key)}
                  aria-pressed={icon === key}
                  title={key}
                  className={`flex size-16 items-center justify-center rounded-card border transition-colors ${
                    icon === key
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-line text-ink-soft hover:border-ink-soft'
                  }`}
                >
                  <CategoryIcon name={key} size={34} />
                </button>
              ))}
            </div>
          </div>
        )}

        <Field label="Orden" hint="Menor aparece primero en el menú.">
          <Input name="position" type="number" defaultValue={c.position ?? 0} className="sm:w-40" />
        </Field>

        <Check
          name="is_active"
          label="Visible en el menú"
          defaultChecked={isNew ? true : c.is_active}
        />

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <SubmitButton>{isNew ? 'Crear categoría' : 'Guardar cambios'}</SubmitButton>
          <FormStatus state={state} />
        </div>
      </form>

      {c.id && (
        <form action={deleteCategory} className="border-t border-line pt-6">
          <input type="hidden" name="id" value={c.id} />
          <p className="mb-3 text-sm text-ink-soft">
            Al eliminarla también se eliminan sus subcategorías. Las plantas quedan sin categoría.
          </p>
          <SubmitButton variant="danger">Eliminar categoría</SubmitButton>
        </form>
      )}
    </div>
  );
}
