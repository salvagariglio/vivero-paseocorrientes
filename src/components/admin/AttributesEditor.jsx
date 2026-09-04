'use client';

import { useState } from 'react';
import ReferenceIcon from '@/components/icons/ReferenceIcon';

/**
 * Carga de referencias por planta. Las opciones vienen de
 * attribute_definitions, asi que este formulario cambia cuando el vivero
 * cambia sus referencias, sin tocar codigo.
 *
 * Guarda en products.attributes: { riego: 'mucho', floracion: ['verano'] }
 */
export default function AttributesEditor({
  name = 'attributes',
  definitions = [],
  defaultValue = {},
}) {
  const [values, setValues] = useState(() => ({ ...(defaultValue || {}) }));

  if (definitions.length === 0) {
    return (
      <p className="border border-dashed border-line px-4 py-6 text-sm text-ink-soft">
        Este vivero todavía no definió sus referencias. Creálas en{' '}
        <a href="/admin/referencias" className="text-primary underline underline-offset-4">
          Referencias
        </a>{' '}
        y después vas a poder cargarlas acá.
      </p>
    );
  }

  function setOne(key, value) {
    setValues((prev) => {
      const next = { ...prev };
      if (next[key] === value) delete next[key];
      else next[key] = value;
      return next;
    });
  }

  function toggleMany(key, value) {
    setValues((prev) => {
      const current = Array.isArray(prev[key]) ? prev[key] : [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      const out = { ...prev };
      if (next.length === 0) delete out[key];
      else out[key] = next;
      return out;
    });
  }

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(values)} />

      <div className="space-y-5">
        {definitions.map((definition) => {
          const options = Array.isArray(definition.options) ? definition.options : [];
          const current = values[definition.key];

          if (definition.kind === 'text') {
            return (
              <label key={definition.id} className="block">
                <span className="text-sm font-medium text-ink">{definition.label}</span>
                {definition.help && (
                  <span className="mt-0.5 block text-xs text-ink-soft">{definition.help}</span>
                )}
                <input
                  value={current ?? ''}
                  onChange={(e) => setValues((p) => ({ ...p, [definition.key]: e.target.value }))}
                  className="mt-1.5 w-full border border-line bg-white px-3 py-2.5 text-ink"
                />
              </label>
            );
          }

          const isMulti = definition.kind === 'multi';
          const selected = isMulti
            ? Array.isArray(current)
              ? current
              : []
            : current != null
              ? [current]
              : [];

          return (
            <fieldset key={definition.id}>
              <legend className="text-sm font-medium text-ink">{definition.label}</legend>
              {definition.help && (
                <p className="mt-0.5 text-xs text-ink-soft">{definition.help}</p>
              )}

              <div className="mt-2 flex flex-wrap gap-2">
                {options.map((option) => {
                  const active = selected.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        isMulti
                          ? toggleMany(definition.key, option.value)
                          : setOne(definition.key, option.value)
                      }
                      className={`flex items-center gap-2 border px-3 py-2 text-sm transition-colors ${
                        active
                          ? 'border-primary bg-primary/10 text-ink'
                          : 'border-line text-ink-soft hover:border-ink-soft'
                      }`}
                    >
                      <ReferenceIcon
                        name={option.icon}
                        size={20}
                        className={active ? 'text-primary' : 'text-ink-soft/60'}
                      />
                      {option.label}
                    </button>
                  );
                })}
              </div>

              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setValues((prev) => {
                      const out = { ...prev };
                      delete out[definition.key];
                      return out;
                    })
                  }
                  className="mt-2 text-xs text-ink-soft underline underline-offset-4 hover:text-ink"
                >
                  Sin dato
                </button>
              )}
            </fieldset>
          );
        })}
      </div>
    </div>
  );
}
