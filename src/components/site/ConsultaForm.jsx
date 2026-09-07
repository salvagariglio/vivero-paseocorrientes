'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { submitConsulta } from '@/app/(site)/consulta/actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-pill bg-primary px-7 py-3 text-sm font-medium text-on-dark transition-opacity hover:opacity-90 disabled:opacity-40"
    >
      {pending ? 'Enviando…' : 'Enviar la consulta'}
    </button>
  );
}

const field =
  'mt-1.5 w-full rounded-sm border border-line bg-card px-3 py-2.5 text-ink placeholder:text-earth/60';

export default function ConsultaForm({ whatsapp, sugerencia }) {
  const [state, formAction] = useActionState(submitConsulta, null);

  if (state?.ok) {
    return (
      <div className="panel px-6 py-14 text-center">
        <p className="font-display text-3xl leading-tight text-primary-deep">
          Recibimos tu consulta
        </p>
        <p className="mx-auto mt-3 max-w-[48ch] leading-relaxed text-earth">
          La miramos, vemos disponibilidad y te pasamos el presupuesto. Si te corre el
          tiempo, escribinos y lo resolvemos al momento.
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

  return (
    <form action={formAction} className="panel max-w-2xl p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm text-ink">Nombre</span>
          <input name="name" required maxLength={120} className={field} />
        </label>

        <label className="block">
          <span className="text-sm text-ink">Teléfono</span>
          <input name="phone" required maxLength={60} inputMode="tel" className={field} />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="text-sm text-ink">
          Email <span className="text-earth">(opcional)</span>
        </span>
        <input name="email" type="email" maxLength={160} className={field} />
      </label>

      <label className="mt-4 block">
        <span className="text-sm text-ink">Qué necesitás</span>
        <span className="mt-0.5 block text-xs text-earth">
          Contanos con tus palabras: especies, cantidades aproximadas, para qué es y para
          cuándo. Con eso te armamos el presupuesto.
        </span>
        <textarea
          name="message"
          required
          rows={7}
          maxLength={2000}
          defaultValue={sugerencia ?? ''}
          placeholder={
            'Por ejemplo:\n\nNecesito unos 20 plantines para una vereda en Deheza, y 3 árboles medianos que den sombra. Sería para plantar el mes que viene.'
          }
          className={field}
        />
      </label>

      {state?.message && !state.ok && (
        <p role="alert" className="mt-4 text-sm text-accent">
          {state.message}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <SubmitButton />
        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-earth underline underline-offset-4 hover:text-primary"
          >
            o escribinos por WhatsApp
          </a>
        )}
      </div>
    </form>
  );
}
