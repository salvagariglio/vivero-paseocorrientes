'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { FileSpreadsheet, TriangleAlert } from 'lucide-react';
import { previewPriceImport, applyPriceImport } from '@/app/admin/actions';
import { formatPrice } from '@/lib/format';
import { IMPORT_FIELDS, ROUNDINGS, OUTCOMES, DEFAULT_ROUNDING } from '@/lib/price-import';
import { Field, Select, Check, FormStatus } from './Form';

const MUESTRA = 40;

function Boton({ children, pendingLabel = 'Leyendo…', variant = 'primary', disabled = false }) {
  const { pending } = useFormStatus();
  const styles =
    variant === 'ghost'
      ? 'border border-line text-ink hover:border-primary'
      : 'bg-primary text-on-dark hover:opacity-90';

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={`rounded-pill px-6 py-2.5 text-sm font-medium transition-all disabled:opacity-50 ${styles}`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

/** El detalle de un grupo: se abre solo si la persona quiere mirarlo. */
function Grupo({ label, items, settings, note }) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;

  return (
    <div className="border-t border-line py-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-baseline justify-between gap-4 text-left"
      >
        <span className="text-sm text-ink">{label}</span>
        <span className="text-sm tabular-nums text-ink-soft">
          {items.length} {open ? '−' : '+'}
        </span>
      </button>

      {open && (
        <ul className="mt-3 space-y-1.5">
          {items.slice(0, MUESTRA).map((item) => (
            <li key={item.line} className="flex flex-wrap items-baseline gap-x-3 text-xs">
              <span className="w-10 shrink-0 tabular-nums text-ink-soft">{item.line}</span>
              <span className="min-w-0 flex-1 truncate text-ink">
                {item.name || 'Sin nombre'}
                {item.size ? ` · ${item.size}` : ''}
                {item.sku ? ` · ${item.sku}` : ''}
                {item.via === 'nombre' && (
                  <span className="text-ink-soft"> · enganchada por nombre</span>
                )}
                {note && <span className="text-ink-soft"> · {note(item)}</span>}
              </span>
              <span className="shrink-0 tabular-nums text-ink-soft">
                {formatPrice(item.oldPrice, settings) ?? 'sin precio'}
              </span>
              <span className="shrink-0 tabular-nums text-ink">
                → {formatPrice(item.price, settings) ?? 'sin precio'}
              </span>
            </li>
          ))}
          {items.length > MUESTRA && (
            <li className="pt-1 text-xs text-ink-soft">y {items.length - MUESTRA} más.</li>
          )}
        </ul>
      )}
    </div>
  );
}

function Importer({ settings, onReset }) {
  const [preview, previewAction] = useActionState(previewPriceImport, null);
  const [applied, applyAction] = useActionState(applyPriceImport, null);
  const [file, setFile] = useState(null);
  // La categoria que elige la persona para cada valor de la planilla.
  // Se guarda por etiqueta, asi sobrevive a un "volver a leer".
  const [categoryChoice, setCategoryChoice] = useState({});

  const saved = settings?.price_import ?? {};
  const headers = preview?.headers ?? [];
  const columns = preview?.columns ?? saved.columns ?? {};
  const rounding = preview?.rounding ?? saved.rounding ?? DEFAULT_ROUNDING;
  const items = preview?.ok ? preview.items : [];
  const categories = preview?.categories ?? [];

  // Lo que resolvio la previsualizacion, y encima lo que elija la persona.
  const resolved = {};
  const categoryLabels = [];
  for (const item of items) {
    if (!item.categoryLabel) continue;
    if (!(item.categoryLabel in resolved)) resolved[item.categoryLabel] = item.categorySlug ?? '';
    if (item.outcome !== 'alta') continue;
    const found = categoryLabels.find((c) => c.label === item.categoryLabel);
    if (found) found.count += 1;
    else categoryLabels.push({ label: item.categoryLabel, count: 1 });
  }

  const slugFor = (label) => categoryChoice[label] ?? resolved[label] ?? '';
  const categoryOf = (item) => slugFor(item.categoryLabel);
  const categoryName = (slug) => categories.find((c) => c.slug === slug)?.name ?? null;

  // Se guarda el mapa de TODA la planilla, no solo el de las altas: la
  // proxima vez ya viene resuelto aunque las filas que lleguen sean otras.
  const categoryMap = Object.fromEntries(
    Object.keys(resolved)
      .filter((label) => slugFor(label))
      .map((label) => [label, slugFor(label)])
  );

  if (applied?.applied) {
    return (
      <div className="mt-8 rounded-card border border-primary/30 bg-primary/5 p-6">
        <p className="font-display text-2xl text-ink">{applied.message}</p>
        <button
          type="button"
          onClick={onReset}
          className="mt-5 rounded-pill bg-primary px-5 py-2.5 text-sm font-medium text-on-dark hover:opacity-90"
        >
          Subir otra lista
        </button>
      </div>
    );
  }

  // Lo unico que viaja al aplicar: nada de esto vuelve a tocar el catalogo
  // mas alla del precio. Los datos de alta solo se usan si se pidieron.
  const payload = items.map((item) =>
    item.outcome === 'alta'
      ? {
          productId: null,
          sku: item.sku,
          slug: item.slug,
          name: item.name,
          scientific: item.scientific,
          envase: item.envase,
          categorySlug: categoryOf(item) || null,
          price: item.price,
          outcome: item.outcome,
        }
      : {
          productId: item.productId,
          sku: item.sku,
          slug: item.slug,
          name: item.name,
          price: item.price,
          outcome: item.outcome,
        }
  );

  const cambios = preview?.ok ? preview.counts.sube + preview.counts.baja : 0;
  const altas = preview?.ok ? preview.counts.alta : 0;

  return (
    <>
      <form action={previewAction} className="mt-8 space-y-5 rounded-card border border-line bg-card p-6">
        <div>
          <span className="text-sm font-medium text-ink">La planilla</span>
          <span className="mt-0.5 block text-xs text-ink-soft">
            Un archivo .xlsx. La primera fila tiene que ser el encabezado de las columnas.
          </span>

          <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-card border border-dashed border-line px-4 py-4 text-sm hover:border-primary">
            <FileSpreadsheet size={20} strokeWidth={1.75} className="shrink-0 text-ink-soft" />
            <span className={file ? 'text-ink' : 'text-ink-soft'}>
              {file ?? 'Elegir planilla…'}
            </span>
            <input
              type="file"
              name="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(event) => setFile(event.target.files?.[0]?.name ?? null)}
              className="sr-only"
            />
          </label>
        </div>

        <Field
          label="Los centavos"
          hint="La planilla los trae de la fórmula de markup. Elegí dónde cortar."
          className="max-w-xs"
        >
          <Select name="rounding" defaultValue={rounding}>
            {ROUNDINGS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} — {option.hint}
              </option>
            ))}
          </Select>
        </Field>

        {/* Recien cuando leimos la planilla sabemos que columnas tiene. */}
        {headers.length > 0 && (
          <fieldset className="border-t border-line pt-5">
            <legend className="text-sm font-medium text-ink">Qué columna es cuál</legend>
            <p className="mt-1 text-xs text-ink-soft">
              Lo detectamos por el encabezado, así que el orden de las columnas no importa. Si algo
              quedó mal, cambialo y volvé a previsualizar: queda guardado para la próxima.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {IMPORT_FIELDS.map((field) => (
                <Field key={field.key} label={field.label} hint={field.hint}>
                  <Select name={`column.${field.key}`} defaultValue={columns[field.key] ?? ''}>
                    <option value="">— sin usar —</option>
                    {headers.map(
                      (header, index) =>
                        header && (
                          <option key={`${header}-${index}`} value={header}>
                            {header}
                          </option>
                        )
                    )}
                  </Select>
                </Field>
              ))}
            </div>
          </fieldset>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <Boton variant={preview?.ok ? 'ghost' : 'primary'}>
            {preview?.ok ? 'Volver a leer' : 'Previsualizar'}
          </Boton>
          {!preview?.ok && (
            <span className="text-xs text-ink-soft">Todavía no se cambia nada.</span>
          )}
        </div>

        <FormStatus state={preview?.ok ? null : preview} />
      </form>

      {preview?.ok && (
        <section className="mt-8">
          <h2 className="rule font-display text-2xl leading-none text-ink">
            {preview.filename}
          </h2>
          <p className="mt-2 text-sm text-ink-soft">
            {preview.total} filas leídas. Nada de esto se aplicó todavía.
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-5">
            {OUTCOMES.map(({ key, label }) => (
              <div key={key} className="bg-card px-4 py-5 text-center">
                <dt className="text-xs leading-snug text-ink-soft">{label}</dt>
                <dd className="mt-1 font-display text-3xl leading-none text-ink tabular-nums">
                  {preview.counts[key]}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 rounded-card border border-line bg-card px-5 py-2">
            {OUTCOMES.map(({ key, label }) => (
              <Grupo
                key={key}
                label={label}
                items={items.filter((item) => item.outcome === key)}
                settings={settings}
                note={
                  key === 'alta'
                    ? (item) => categoryName(categoryOf(item)) ?? 'sin categoría'
                    : undefined
                }
              />
            ))}

            {preview.absent.length > 0 && (
              <div className="border-t border-line py-3">
                <p className="text-sm text-ink">
                  En el catálogo y no en la planilla
                  <span className="float-right tabular-nums text-ink-soft">
                    {preview.absent.length}
                  </span>
                </p>
                <p className="mt-1 text-xs text-ink-soft">
                  No se tocan. Suelen ser las que el vivero dejó de traer:{' '}
                  {preview.absent.slice(0, 6).map((p) => p.name).join(', ')}
                  {preview.absent.length > 6 && '…'}
                </p>
              </div>
            )}
          </div>

          {preview.duplicates.length > 0 && (
            <p className="mt-5 flex gap-3 border border-accent/40 bg-accent/5 px-4 py-3 text-sm text-ink">
              <TriangleAlert size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-accent" />
              <span>
                Hay {preview.duplicates.length}{' '}
                {preview.duplicates.length === 1 ? 'planta' : 'plantas'} con más de una fila en la
                planilla (
                {preview.duplicates
                  .slice(0, 3)
                  .map((d) => `${d.name}: filas ${d.lines.join(', ')}`)
                  .join(' · ')}
                ). Va a quedar el precio de la última.
              </span>
            </p>
          )}

          <form action={applyAction} className="mt-8 rounded-card border border-line bg-card p-6">
            <input type="hidden" name="items" value={JSON.stringify(payload)} />
            <input type="hidden" name="columns" value={JSON.stringify(preview.columns)} />
            <input type="hidden" name="categories" value={JSON.stringify(categoryMap)} />
            <input type="hidden" name="rounding" value={preview.rounding} />
            <input type="hidden" name="filename" value={preview.filename} />
            <input type="hidden" name="absent" value={preview.absent.length} />

            {/* La planilla agrupa con sus nombres y el catálogo con los suyos.
                Ese pareo es dato del vivero, no una constante nuestra. */}
            {categoryLabels.length > 0 && (
              <fieldset className="pb-5">
                <legend className="text-sm font-medium text-ink">
                  A qué categoría van las plantas nuevas
                </legend>
                <p className="mt-1 text-xs text-ink-soft">
                  Lo que elijas queda guardado para las próximas listas. Si dejás alguna sin
                  categoría, la planta se carga igual y la ubicás después.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {categoryLabels.map(({ label, count }) => (
                    <Field key={label} label={label} hint={`${count} ${count === 1 ? 'planta' : 'plantas'}`}>
                      <Select
                        value={slugFor(label)}
                        onChange={(event) =>
                          setCategoryChoice((prev) => ({ ...prev, [label]: event.target.value }))
                        }
                      >
                        <option value="">— sin categoría —</option>
                        {categories.map((category) => (
                          <option key={category.slug} value={category.slug}>
                            {'  '.repeat(category.depth)}
                            {category.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  ))}
                </div>
              </fieldset>
            )}

            {altas > 0 && (
              <div className="pb-4">
                <Check
                  name="create_new"
                  label={`Cargar también las ${altas} plantas que no están en el catálogo`}
                  hint="Entran sin publicar y sin foto, para que las revises antes de que salgan al sitio."
                />
              </div>
            )}

            <p className="text-sm text-ink">
              {cambios === 0
                ? 'Ningún precio cambia con esta planilla.'
                : `Se van a actualizar ${cambios} ${cambios === 1 ? 'precio' : 'precios'}.`}{' '}
              <span className="text-ink-soft">
                No se tocan fotos, promociones, descuentos ni datos de cuidado.
              </span>
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-4">
              <Boton pendingLabel="Aplicando…" disabled={cambios === 0 && altas === 0}>
                Aplicar al catálogo
              </Boton>
              <FormStatus state={applied} />
            </div>
          </form>
        </section>
      )}
    </>
  );
}

export default function PriceImport({ settings }) {
  const [round, setRound] = useState(0);
  return <Importer key={round} settings={settings} onReset={() => setRound((n) => n + 1)} />;
}
