'use client';

import { useActionState, useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { saveQuote } from '@/app/admin/actions';
import { formatPrice, promoState } from '@/lib/format';
import { calculateQuote, lineTotal, QUOTE_STATUS } from '@/lib/quote';
import { Field, Input, Textarea, Select, SubmitButton, FormStatus, Fieldset } from './Form';

/** Precio con el que entra una planta: el de promo si esta vigente. */
function currentPrice(product) {
  const promo = promoState(product);
  return Number(promo.effective) || 0;
}

function detailOf(product) {
  return [product.scientific_name, product.attributes?.envase].filter(Boolean).join(' · ') || null;
}

export default function QuoteBuilder({ quote, catalog = [], paymentMethods = [], settings }) {
  const q = quote ?? {};
  const isNew = !q.id;

  const [state, formAction] = useActionState(saveQuote, null);

  const [items, setItems] = useState(() =>
    (q.items ?? []).map((i) => ({
      key: i.id,
      product_id: i.product_id,
      name: i.name,
      detail: i.detail,
      unit_price: Number(i.unit_price) || 0,
      qty: Number(i.qty) || 1,
      allow_discount: i.allow_discount !== false,
    }))
  );
  const [discountPct, setDiscountPct] = useState(Number(q.discount_pct) || 0);
  const [methodId, setMethodId] = useState(q.payment_method_id ?? '');
  const [search, setSearch] = useState('');

  const method = paymentMethods.find((m) => m.id === methodId);
  // En un presupuesto ya guardado manda el porcentaje congelado.
  const adjustPct = method ? Number(method.adjust_pct) || 0 : Number(q.payment_adjust_pct) || 0;

  const totals = useMemo(
    () => calculateQuote(items, { discountPct, paymentAdjustPct: adjustPct }),
    [items, discountPct, adjustPct]
  );

  const matches = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (term.length < 2) return [];
    return catalog
      .filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (p.scientific_name || '').toLowerCase().includes(term) ||
          (p.sku || '').toLowerCase().includes(term)
      )
      .slice(0, 8);
  }, [catalog, search]);

  function addProduct(product) {
    setItems((prev) => {
      const existing = prev.findIndex((i) => i.product_id === product.id);
      if (existing >= 0) {
        return prev.map((i, idx) => (idx === existing ? { ...i, qty: i.qty + 1 } : i));
      }
      return [
        ...prev,
        {
          key: `${product.id}-${Date.now()}`,
          product_id: product.id,
          name: product.name,
          detail: detailOf(product),
          unit_price: currentPrice(product),
          qty: 1,
          allow_discount: product.allow_discount !== false,
        },
      ];
    });
    setSearch('');
  }

  function addFreeItem() {
    setItems((prev) => [
      ...prev,
      {
        key: `libre-${Date.now()}`,
        product_id: null,
        name: '',
        detail: null,
        unit_price: 0,
        qty: 1,
        allow_discount: true,
      },
    ]);
  }

  const update = (key, patch) =>
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));

  const money = (n) => formatPrice(n, settings) ?? '—';

  return (
    <form action={formAction} className="space-y-8">
      {q.id && <input type="hidden" name="id" value={q.id} />}
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(
          items.map(({ key, ...rest }) => rest)
        )}
      />
      <input type="hidden" name="discount_pct" value={discountPct} />
      <input type="hidden" name="payment_method_id" value={methodId} />

      {/* ---------------- Buscador ---------------- */}
      <div>
        <label className="block">
          <span className="text-sm font-medium text-ink">Agregar del catálogo</span>
          <span className="mt-0.5 block text-xs text-ink-soft">
            Buscá por nombre, especie o código. El precio entra desde la lista y se puede pisar.
          </span>
          <div className="relative mt-2">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Álamo, Cina Cina, P001…"
              className="pl-10"
            />
          </div>
        </label>

        {matches.length > 0 && (
          <ul className="mt-2 divide-y divide-line rounded-card border border-line bg-card">
            {matches.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => addProduct(p)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink">{p.name}</span>
                    {detailOf(p) && (
                      <span className="block truncate text-xs text-ink-soft">{detailOf(p)}</span>
                    )}
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-ink-soft">
                    {money(currentPrice(p))}
                  </span>
                  <Plus size={15} className="shrink-0 text-primary" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={addFreeItem}
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <Plus size={14} /> Agregar un concepto libre (flete, plantación…)
        </button>
      </div>

      {/* ---------------- Items ---------------- */}
      {items.length === 0 ? (
        <p className="rounded-card border border-dashed border-line px-4 py-10 text-center text-sm text-ink-soft">
          Todavía no agregaste nada. Buscá una planta arriba para empezar.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.key} className="rounded-card border border-line bg-card p-3">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-48 flex-1">
                  {item.product_id ? (
                    <>
                      <p className="text-sm font-medium text-ink">{item.name}</p>
                      {item.detail && <p className="text-xs text-ink-soft">{item.detail}</p>}
                    </>
                  ) : (
                    <Input
                      value={item.name}
                      onChange={(e) => update(item.key, { name: e.target.value })}
                      placeholder="Flete, plantación, mantenimiento…"
                      aria-label="Concepto"
                    />
                  )}
                </div>

                <label className="w-24">
                  <span className="block text-[0.65rem] text-ink-soft">Cantidad</span>
                  <Input
                    type="number"
                    min="0.01"
                    step="1"
                    value={item.qty}
                    onChange={(e) => update(item.key, { qty: Number(e.target.value) })}
                    className="text-right tabular-nums"
                  />
                </label>

                <label className="w-32">
                  <span className="block text-[0.65rem] text-ink-soft">Precio unitario</span>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={item.unit_price}
                    onChange={(e) => update(item.key, { unit_price: Number(e.target.value) })}
                    className="text-right tabular-nums"
                  />
                </label>

                <div className="w-28 pt-4 text-right text-sm font-medium tabular-nums text-ink">
                  {money(lineTotal(item))}
                </div>

                <button
                  type="button"
                  onClick={() => setItems((prev) => prev.filter((i) => i.key !== item.key))}
                  aria-label={`Quitar ${item.name || 'ítem'}`}
                  className="mt-4 shrink-0 rounded-sm border border-line p-2 text-ink-soft hover:border-accent hover:text-accent"
                >
                  <X size={14} />
                </button>
              </div>

              <label className="mt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!item.allow_discount}
                  onChange={(e) => update(item.key, { allow_discount: !e.target.checked })}
                  className="size-3.5 accent-[var(--c-accent)]"
                />
                <span className="text-xs text-ink-soft">
                  Precio firme: no le aplica el descuento general
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}

      {/* ---------------- Totales ---------------- */}
      <div className="rounded-card bg-surface-alt p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Descuento general" hint="Salta los ítems marcados como precio firme.">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="100"
                step="1"
                value={discountPct}
                onChange={(e) => setDiscountPct(Number(e.target.value))}
                className="text-right tabular-nums"
              />
              <span className="text-sm text-ink-soft">%</span>
            </div>
          </Field>

          <Field
            label="Forma de pago"
            hint={
              method
                ? adjustPct === 0
                  ? 'Sin ajuste.'
                  : `${adjustPct > 0 ? 'Recarga' : 'Descuenta'} ${Math.abs(adjustPct)}%.`
                : 'Los porcentajes se editan en Marca y datos.'
            }
          >
            <Select value={methodId} onChange={(e) => setMethodId(e.target.value)}>
              <option value="">Sin especificar</option>
              {paymentMethods
                .filter((m) => m.is_active)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                    {Number(m.adjust_pct) !== 0
                      ? ` (${Number(m.adjust_pct) > 0 ? '+' : ''}${Number(m.adjust_pct)}%)`
                      : ''}
                  </option>
                ))}
            </Select>
          </Field>
        </div>

        <dl className="mt-5 space-y-1.5 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-soft">
              Subtotal · {totals.items} {totals.items === 1 ? 'ítem' : 'ítems'}
            </dt>
            <dd className="tabular-nums text-ink">{money(totals.subtotal)}</dd>
          </div>

          {totals.discountAmount > 0 && (
            <div className="flex justify-between">
              <dt className="text-ink-soft">
                Descuento {totals.discountPct}%
                {totals.firmCount > 0 && (
                  <span className="text-xs"> · {totals.firmCount} a precio firme</span>
                )}
              </dt>
              <dd className="tabular-nums text-accent">−{money(totals.discountAmount)}</dd>
            </div>
          )}

          {totals.adjustAmount !== 0 && (
            <div className="flex justify-between">
              <dt className="text-ink-soft">
                {method?.name ?? 'Forma de pago'} {totals.adjustPct > 0 ? '+' : ''}
                {totals.adjustPct}%
              </dt>
              <dd className="tabular-nums text-ink">
                {totals.adjustAmount < 0 ? '−' : '+'}
                {money(Math.abs(totals.adjustAmount))}
              </dd>
            </div>
          )}

          <div className="flex justify-between border-t border-line pt-2.5">
            <dt className="font-display text-xl text-primary-deep">Total</dt>
            <dd className="font-display text-xl tabular-nums text-primary-deep">
              {money(totals.total)}
            </dd>
          </div>
        </dl>
      </div>

      {/* ---------------- Datos ---------------- */}
      <Fieldset title="Para quién es">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Nombre">
            <Input name="customer_name" defaultValue={q.customer_name ?? ''} />
          </Field>
          <Field label="Teléfono">
            <Input name="customer_phone" defaultValue={q.customer_phone ?? ''} />
          </Field>
          <Field label="Email">
            <Input name="customer_email" type="email" defaultValue={q.customer_email ?? ''} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Validez" hint="Días desde hoy. 0 = sin vencimiento.">
            <Input
              name="valid_days"
              type="number"
              min="0"
              defaultValue={q.valid_days ?? 15}
              className="tabular-nums"
            />
          </Field>
          <Field label="Estado">
            <Select name="status" defaultValue={q.status ?? 'borrador'}>
              {QUOTE_STATUS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Notas" hint="Se imprimen al pie del presupuesto.">
          <Textarea name="notes" rows={3} defaultValue={q.notes ?? ''} />
        </Field>
      </Fieldset>

      <div className="flex flex-wrap items-center gap-4 border-t border-line pt-6">
        <SubmitButton>{isNew ? 'Crear presupuesto' : 'Guardar cambios'}</SubmitButton>
        <FormStatus state={state} />
      </div>
    </form>
  );
}
