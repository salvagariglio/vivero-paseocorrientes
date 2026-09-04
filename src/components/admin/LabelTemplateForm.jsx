'use client';

import { useActionState, useState } from 'react';
import { saveLabelTemplate } from '@/app/admin/actions';
import { Field, Input, Select, Check, SubmitButton, FormStatus } from './Form';
import { THEME_TOKENS } from '@/lib/theme';

export default function LabelTemplateForm({ template }) {
  const [state, formAction] = useActionState(saveLabelTemplate, null);
  const [open, setOpen] = useState(!template);
  const t = template ?? {};

  if (!open) {
    return (
      <div className="flex items-center justify-between border border-line bg-white px-4 py-3">
        <div>
          <p className="text-sm font-medium text-ink">{t.name}</p>
          <p className="text-xs text-ink-soft">
            {t.width_mm}×{t.height_mm} mm · QR {t.qr_mm} mm · {t.page_size}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm text-primary underline underline-offset-4"
        >
          Editar
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="border border-line bg-white p-5">
      {t.id && <input type="hidden" name="id" value={t.id} />}

      <Field label="Nombre de la plantilla">
        <Input name="name" required defaultValue={t.name ?? ''} placeholder="Colgante chica" />
      </Field>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Field label="Ancho (mm)">
          <Input name="width_mm" type="number" step="0.5" min="10" defaultValue={t.width_mm ?? 50} />
        </Field>
        <Field label="Alto (mm)">
          <Input name="height_mm" type="number" step="0.5" min="10" defaultValue={t.height_mm ?? 80} />
        </Field>
        <Field label="QR (mm)">
          <Input name="qr_mm" type="number" step="0.5" min="8" defaultValue={t.qr_mm ?? 22} />
        </Field>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Field label="Separacion (mm)">
          <Input name="gap_mm" type="number" step="0.5" min="0" defaultValue={t.gap_mm ?? 4} />
        </Field>
        <Field label="Margen de hoja (mm)">
          <Input name="margin_mm" type="number" step="0.5" min="0" defaultValue={t.margin_mm ?? 8} />
        </Field>
        <Field label="Hoja">
          <Select name="page_size" defaultValue={t.page_size ?? 'A4'}>
            <option value="A4">A4</option>
            <option value="Letter">Carta</option>
          </Select>
        </Field>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Field label="Fondo" hint="Token de color, no un hex.">
          <Select name="bg_token" defaultValue={t.bg_token ?? 'card'}>
            {THEME_TOKENS.map((token) => (
              <option key={token.key} value={token.key}>
                {token.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Texto y QR">
          <Select name="fg_token" defaultValue={t.fg_token ?? 'ink'}>
            {THEME_TOKENS.map((token) => (
              <option key={token.key} value={token.key}>
                {token.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Detalle" hint="Precio y borde.">
          <Select name="accent_token" defaultValue={t.accent_token ?? 'accent'}>
            {THEME_TOKENS.map((token) => (
              <option key={token.key} value={token.key}>
                {token.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="mt-4 grid gap-1 sm:grid-cols-2">
        <Check name="show_logo" label="Mostrar el logo" defaultChecked={t.show_logo ?? true} />
        <Check name="show_price" label="Mostrar el precio" defaultChecked={t.show_price ?? true} />
        <Check
          name="show_scientific"
          label="Mostrar el nombre cientifico"
          defaultChecked={t.show_scientific ?? true}
        />
        <Check
          name="show_description"
          label="Mostrar la descripcion corta"
          defaultChecked={t.show_description ?? true}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <SubmitButton>{t.id ? 'Guardar plantilla' : 'Crear plantilla'}</SubmitButton>
        <FormStatus state={state} />
      </div>
    </form>
  );
}
