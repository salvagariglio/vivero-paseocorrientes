'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { X } from 'lucide-react';
import { submitQuoteRequest } from '@/app/(site)/pedido/actions';
import { useOrder } from './OrderProvider';

function SubmitButton({ disabled }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="rounded-pill bg-primary px-7 py-3 text-sm font-medium text-on-dark transition-opacity hover:opacity-90 disabled:opacity-40"
    >
      {pending ? 'Enviando…' : 'Enviar la consulta'}
    </button>
  );
}

export default function OrderForm({ whatsapp }) {
  const order = useOrder();
  const [state, formAction] = useActionState(submitQuoteRequest, null);

  // Enviada y aceptada: se limpia la lista para no mandarla dos veces.
  useEffect(() => {
    if (state?.ok) order.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.ok]);

  if (state?.ok) {
    return (
      <div className="panel px-6 py-12 text-center">
        <p className="font-display text-3xl leading-tight text-primary-deep">
          Recibimos tu consulta
        </p>
        <p className="mx-auto mt-3 max-w-[46ch] leading-relaxed text-earth">
          La revisamos y te pasamos el presupuesto. Si necesitás algo con urgencia,
          escribinos y lo vemos al momento.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/catalogo"
            className="rounded-pill bg-primary px-6 py-3 text-sm font-medium text-on-dark"
          >
            Seguir viendo el catálogo
          </Link>
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-pill border border-primary/30 px-6 py-3 text-sm font-medium text-primary-deep"
            >
              Escribir por WhatsApp
            </a>
          )}
        </div>
      </div>
    );
  }

  if (!order.loaded) {
    return <p className="py-10 text-center text-sm text-earth">Cargando tu lista…</p>;
  }

  if (order.items.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-line px-6 py-14 text-center">
        <p className="font-display text-2xl text-primary-deep">Tu consulta está vacía</p>
        <p className="mt-2 text-earth">
          Entrá al catálogo y sumá las plantas que necesites, con la cantidad.
        </p>
        <Link
          href="/catalogo"
          className="mt-6 inline-block rounded-pill bg-primary px-6 py-3 text-sm font-medium text-on-dark"
        >
          Ir al catálogo
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
      <input type="hidden" name="items" value={JSON.stringify(order.items)} />

      {/* --------- La lista --------- */}
      <div>
        <ul className="divide-y divide-line rounded-card border border-line bg-card">
          {order.items.map((item) => (
            <li key={item.product_id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                {item.slug ? (
                  <Link
                    href={`/planta/${item.slug}`}
                    className="block truncate text-sm text-ink hover:text-primary"
                  >
                    {item.name}
                  </Link>
                ) : (
                  <span className="block truncate text-sm text-ink">{item.name}</span>
                )}
                {item.detail && (
                  <span className="binomial block truncate text-xs">{item.detail}</span>
                )}
              </div>

              <label className="shrink-0">
                <span className="sr-only">Cantidad de {item.name}</span>
                <input
                  type="number"
                  min="1"
                  max="9999"
                  value={item.qty}
                  onChange={(e) => order.setQty(item.product_id, e.target.value)}
                  className="w-20 rounded-sm border border-line bg-card px-2 py-1.5 text-right text-sm tabular-nums text-ink"
                />
              </label>

              <button
                type="button"
                onClick={() => order.remove(item.product_id)}
                aria-label={`Quitar ${item.name}`}
                className="shrink-0 rounded-sm border border-line p-2 text-earth transition-colors hover:border-accent hover:text-accent"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex items-center justify-between px-1">
          <p className="caption text-[0.65rem] text-earth">
            {order.count} {order.count === 1 ? 'unidad' : 'unidades'} ·{' '}
            {order.items.length} {order.items.length === 1 ? 'especie' : 'especies'}
          </p>
          <button
            type="button"
            onClick={() => order.clear()}
            className="text-xs text-earth underline underline-offset-4 hover:text-ink"
          >
            Vaciar
          </button>
        </div>
      </div>

      {/* --------- Los datos --------- */}
      <div className="panel h-fit p-6">
        <h2 className="font-display text-2xl leading-none text-primary-deep">Tus datos</h2>
        <p className="mt-2 text-sm leading-relaxed text-earth">
          Con esto te armamos el presupuesto y te lo pasamos.
        </p>

        <div className="mt-5 space-y-3">
          <label className="block">
            <span className="text-sm text-ink">Nombre</span>
            <input
              name="name"
              required
              maxLength={120}
              className="mt-1.5 w-full rounded-sm border border-line bg-card px-3 py-2.5 text-ink"
            />
          </label>

          <label className="block">
            <span className="text-sm text-ink">Teléfono</span>
            <input
              name="phone"
              required
              maxLength={60}
              inputMode="tel"
              className="mt-1.5 w-full rounded-sm border border-line bg-card px-3 py-2.5 text-ink"
            />
          </label>

          <label className="block">
            <span className="text-sm text-ink">
              Email <span className="text-earth">(opcional)</span>
            </span>
            <input
              name="email"
              type="email"
              maxLength={160}
              className="mt-1.5 w-full rounded-sm border border-line bg-card px-3 py-2.5 text-ink"
            />
          </label>

          <label className="block">
            <span className="text-sm text-ink">
              Contanos para qué es <span className="text-earth">(opcional)</span>
            </span>
            <textarea
              name="message"
              rows={3}
              maxLength={1000}
              placeholder="Una obra, un jardín, cuándo lo necesitás…"
              className="mt-1.5 w-full rounded-sm border border-line bg-card px-3 py-2.5 text-ink placeholder:text-earth/60"
            />
          </label>
        </div>

        {state?.message && !state.ok && (
          <p role="alert" className="mt-4 text-sm text-accent">
            {state.message}
          </p>
        )}

        <div className="mt-6">
          <SubmitButton disabled={order.items.length === 0} />
        </div>
      </div>
    </form>
  );
}
