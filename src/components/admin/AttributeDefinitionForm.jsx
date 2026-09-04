'use client';

import { useActionState, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { saveAttributeDefinition, deleteAttributeDefinition } from '@/app/admin/actions';
import ReferenceIcon, { ICON_KEYS } from '@/components/icons/ReferenceIcon';
import { Field, Input, Select, Check, SubmitButton, FormStatus } from './Form';
import { slugify } from '@/lib/format';

const KINDS = [
  { value: 'scale', label: 'Escala ordenada', hint: 'De menos a más. Ej: Poco → Mucho.' },
  { value: 'single', label: 'Una opción', hint: 'Sin orden. Ej: Perenne / Caduca.' },
  { value: 'multi', label: 'Varias opciones', hint: 'Ej: Floración en verano y primavera.' },
  { value: 'text', label: 'Texto libre', hint: 'Sin opciones, se escribe por planta.' },
];

export default function AttributeDefinitionForm({ definition, onDone }) {
  const [state, formAction] = useActionState(saveAttributeDefinition, null);
  const d = definition ?? {};
  const isNew = !d.id;

  const [kind, setKind] = useState(d.kind ?? 'scale');
  const [options, setOptions] = useState(() =>
    Array.isArray(d.options) && d.options.length
      ? d.options.map((o) => ({ value: o.value ?? '', label: o.label ?? '', icon: o.icon ?? 'circulo' }))
      : []
  );

  const serialized = JSON.stringify(
    options
      .filter((o) => o.label.trim())
      .map((o) => ({
        value: o.value.trim() || slugify(o.label),
        label: o.label.trim(),
        icon: o.icon || 'circulo',
      }))
  );

  const update = (i, field, value) =>
    setOptions((prev) => prev.map((o, j) => (j === i ? { ...o, [field]: value } : o)));

  return (
    <form action={formAction} className="rounded-card border border-line bg-card p-5">
      {d.id && <input type="hidden" name="id" value={d.id} />}
      <input type="hidden" name="options" value={serialized} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" hint="Como aparece en la ficha. Ej: Exposición al sol.">
          <Input name="label" required defaultValue={d.label ?? ''} />
        </Field>
        <Field label="Clave" hint="Identificador interno. Si lo dejás vacío se arma solo.">
          <Input name="key" defaultValue={d.key ?? ''} placeholder="sol" />
        </Field>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Tipo" hint={KINDS.find((k) => k.value === kind)?.hint}>
          <Select name="kind" value={kind} onChange={(e) => setKind(e.target.value)}>
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Orden" hint="Menor aparece primero.">
          <Input name="position" type="number" defaultValue={d.position ?? 0} />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Ayuda" hint="Opcional. Una línea aclaratoria bajo el nombre.">
          <Input name="help" defaultValue={d.help ?? ''} />
        </Field>
      </div>

      {kind !== 'text' && (
        <div className="mt-6">
          <p className="text-sm font-medium text-ink">Opciones</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            En una escala, ordenalas de menor a mayor. El ícono es el que se dibuja en la ficha y en
            la etiqueta.
          </p>

          <ul className="mt-3 space-y-2">
            {options.map((option, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2">
                <span className="text-primary">
                  <ReferenceIcon name={option.icon} size={26} />
                </span>
                <input
                  value={option.label}
                  onChange={(e) => update(i, 'label', e.target.value)}
                  placeholder="Semisombra"
                  aria-label="Nombre de la opción"
                  className="min-w-32 flex-1 border border-line px-3 py-2 text-sm text-ink"
                />
                <select
                  value={option.icon}
                  onChange={(e) => update(i, 'icon', e.target.value)}
                  aria-label="Ícono"
                  className="border border-line px-2 py-2 text-sm text-ink"
                >
                  {ICON_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setOptions((prev) => prev.filter((_, j) => j !== i))}
                  aria-label="Quitar opción"
                  className="border border-line px-2.5 py-2 text-ink-soft hover:border-accent hover:text-accent"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() =>
              setOptions((prev) => [...prev, { value: '', label: '', icon: 'circulo' }])
            }
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <Plus size={14} /> Agregar opción
          </button>
        </div>
      )}

      <div className="mt-6 grid gap-1 sm:grid-cols-2">
        <Check
          name="show_on_card"
          label="Mostrar el ícono en el catálogo"
          defaultChecked={d.show_on_card ?? false}
        />
        <Check
          name="show_on_label"
          label="Mostrar en la etiqueta impresa"
          defaultChecked={d.show_on_label ?? true}
        />
        <Check name="is_active" label="Activa" defaultChecked={isNew ? true : d.is_active} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-line pt-5">
        <SubmitButton>{isNew ? 'Crear referencia' : 'Guardar cambios'}</SubmitButton>
        <FormStatus state={state} />
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="text-sm text-ink-soft underline underline-offset-4"
          >
            Cerrar
          </button>
        )}
      </div>

      {d.id && (
        <div className="mt-5 border-t border-line pt-5">
          <button
            type="submit"
            formAction={deleteAttributeDefinition}
            className="border border-accent px-4 py-2 text-sm text-accent hover:bg-accent hover:text-on-dark"
          >
            Eliminar referencia
          </button>
        </div>
      )}
    </form>
  );
}
