'use client';

import { useActionState, useState } from 'react';
import { saveSettings } from '@/app/admin/actions';
import { resolveTheme, THEME_TOKENS, TYPESET_KEYS } from '@/lib/theme';
import { Field, Input, Textarea, Select, Check, SubmitButton, FormStatus, Fieldset } from './Form';
import ImageUploader from './ImageUploader';

const TYPESET_LABELS = {
  bosque: 'Bosque — Playfair Display + Barlow',
  herbario: 'Herbario — Petrona + Archivo',
  mercado: 'Mercado — Libre Baskerville + Karla',
};

function TokenField({ token, value, onChange }) {
  return (
    <div className="flex items-center gap-3 border border-line bg-white px-3 py-2.5">
      <input
        type="color"
        name={`theme.${token.key}`}
        value={value}
        onChange={(e) => onChange(token.key, e.target.value)}
        aria-label={token.label}
        className="h-9 w-9 shrink-0 cursor-pointer border border-line bg-white p-0.5"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm text-ink">{token.label}</span>
        <span className="block text-xs text-ink-soft">{token.hint}</span>
      </span>
      <span className="shrink-0 font-mono text-xs uppercase text-ink-soft">{value}</span>
    </div>
  );
}

export default function SettingsForm({ tenant }) {
  const [state, formAction] = useActionState(saveSettings, null);
  const s = tenant.settings ?? {};
  const [theme, setTheme] = useState(() => resolveTheme(s.theme));

  const setToken = (key, value) => setTheme((prev) => ({ ...prev, [key]: value }));

  return (
    <form action={formAction} className="space-y-10">
      <div className="space-y-4">
        <Field label="Nombre del vivero">
          <Input name="name" required defaultValue={tenant.name} />
        </Field>

        <Field label="Frase" hint="Una línea corta debajo del nombre, en la portada.">
          <Input name="tagline" defaultValue={s.tagline ?? ''} maxLength={140} />
        </Field>

        <Field label="Sobre el vivero" hint="Aparece en el pie del sitio.">
          <Textarea name="about" rows={4} defaultValue={s.about ?? ''} />
        </Field>
      </div>

      <Fieldset title="Imágenes de marca">
        <ImageUploader
          name="logo_url"
          tenantId={tenant.id}
          folder="marca"
          label="Logo"
          hint="Se ve en la barra superior y en las etiquetas. Fondo transparente queda mejor."
          defaultValue={s.logo_url ?? ''}
        />
        <ImageUploader
          name="cover_url"
          tenantId={tenant.id}
          folder="marca"
          label="Foto de portada"
          defaultValue={s.cover_url ?? ''}
        />
        <ImageUploader
          name="favicon_url"
          tenantId={tenant.id}
          folder="marca"
          label="Ícono de la pestaña"
          defaultValue={s.favicon_url ?? ''}
        />
      </Fieldset>

      <Fieldset
        title="Colores"
        description="Cada color tiene un rol. Podés usar dos o los trece: el sitio siempre pide roles, no cantidades."
      >
        <div className="grid gap-2 lg:grid-cols-2">
          {THEME_TOKENS.map((token) => (
            <TokenField
              key={token.key}
              token={token}
              value={theme[token.key]}
              onChange={setToken}
            />
          ))}
        </div>

        <div
          className="mt-4 border border-line p-5"
          style={{ background: theme.surface, color: theme.ink }}
        >
          <p className="font-display text-2xl leading-none">Así se ve</p>
          <p className="mt-2 text-sm" style={{ color: theme.ink_soft }}>
            Texto secundario sobre el papel del sitio.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span
              className="px-4 py-2 text-sm font-medium"
              style={{ background: theme.primary, color: theme.on_dark }}
            >
              Ver el catálogo
            </span>
            <span
              className="px-3 py-2 text-xs font-medium"
              style={{ background: theme.accent, color: theme.on_dark }}
            >
              20% menos
            </span>
            <span
              className="px-4 py-2 text-sm"
              style={{ background: theme.secondary, color: theme.on_dark }}
            >
              Etiqueta
            </span>
          </div>
        </div>
      </Fieldset>

      <Fieldset title="Tipografía" description="Una combinación de titular y texto para todo el sitio.">
        <Field label="Combinación">
          <Select name="typeset" defaultValue={s.typeset ?? 'bosque'}>
            {TYPESET_KEYS.map((key) => (
              <option key={key} value={key}>
                {TYPESET_LABELS[key] ?? key}
              </option>
            ))}
          </Select>
        </Field>
      </Fieldset>

      <Fieldset title="Precios">
        <Check
          name="show_prices"
          label="Mostrar precios en el catálogo"
          hint="Si lo apagás, el catálogo funciona como muestrario y las etiquetas salen sin precio."
          defaultChecked={s.show_prices ?? true}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Moneda" hint="Código ISO: ARS, USD, UYU…">
            <Input name="currency" defaultValue={s.currency ?? 'ARS'} maxLength={3} />
          </Field>
          <Field label="Formato regional" hint="es-AR, es-UY, es-CL…">
            <Input name="locale" defaultValue={s.locale ?? 'es-AR'} maxLength={10} />
          </Field>
        </div>
      </Fieldset>

      <Fieldset title="Contacto y ubicación">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="WhatsApp" hint="Con código de país, sin espacios: 5493794123456">
            <Input name="whatsapp" defaultValue={s.whatsapp ?? ''} />
          </Field>
          <Field label="Instagram" hint="Solo el usuario.">
            <Input name="instagram" defaultValue={s.instagram ?? ''} placeholder="paseocorrientes" />
          </Field>
          <Field label="Email">
            <Input name="email" type="email" defaultValue={s.email ?? ''} />
          </Field>
          <Field label="Teléfono">
            <Input name="phone" defaultValue={s.phone ?? ''} />
          </Field>
        </div>

        <Field label="Dirección">
          <Input name="address" defaultValue={s.address ?? ''} />
        </Field>
        <Field label="Link de Google Maps">
          <Input name="maps_url" type="url" defaultValue={s.maps_url ?? ''} />
        </Field>
        <Field label="Horarios" hint="Como quieras escribirlo. Ej: Lun a Sáb 9 a 19 h">
          <Input name="opening_hours" defaultValue={s.opening_hours ?? ''} />
        </Field>
      </Fieldset>

      <div className="flex flex-wrap items-center gap-4 border-t border-line pt-6">
        <SubmitButton />
        <FormStatus state={state} />
      </div>
    </form>
  );
}
