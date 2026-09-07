'use client';

import { useActionState, useState } from 'react';
import { Plus } from 'lucide-react';
import { savePaymentMethod, deletePaymentMethod } from '@/app/admin/actions';
import { Field, Input, Check, SubmitButton, FormStatus } from './Form';

function MethodForm({ method, onDone }) {
  const [state, formAction] = useActionState(savePaymentMethod, null);
  const m = method ?? {};
  const isNew = !m.id;

  return (
    <form action={formAction} className="rounded-card border border-line bg-card p-4">
      {m.id && <input type="hidden" name="id" value={m.id} />}

      <div className="grid gap-4 sm:grid-cols-[1fr_9rem_6rem]">
        <Field label="Nombre">
          <Input name="name" required defaultValue={m.name ?? ''} placeholder="Efectivo" />
        </Field>
        <Field label="Ajuste %" hint="Negativo descuenta.">
          <Input
            name="adjust_pct"
            type="number"
            step="0.5"
            min="-100"
            max="100"
            defaultValue={m.adjust_pct ?? 0}
            className="text-right tabular-nums"
          />
        </Field>
        <Field label="Orden">
          <Input
            name="position"
            type="number"
            defaultValue={m.position ?? 0}
            className="text-right tabular-nums"
          />
        </Field>
      </div>

      <div className="mt-2">
        <Check name="is_active" label="Disponible" defaultChecked={isNew ? true : m.is_active} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <SubmitButton>{isNew ? 'Agregar' : 'Guardar'}</SubmitButton>
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
        {m.id && (
          <button
            type="submit"
            formAction={deletePaymentMethod}
            className="ml-auto text-sm text-ink-soft hover:text-accent"
          >
            Eliminar
          </button>
        )}
      </div>
    </form>
  );
}

function Row({ method }) {
  const [editing, setEditing] = useState(false);
  if (editing) return <MethodForm method={method} onDone={() => setEditing(false)} />;

  const adjust = Number(method.adjust_pct) || 0;

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
      <span className="min-w-32 flex-1 text-sm text-ink">
        {method.name}
        {!method.is_active && <span className="text-xs text-ink-soft"> · no disponible</span>}
      </span>
      <span
        className={`shrink-0 text-sm tabular-nums ${
          adjust < 0 ? 'text-accent' : adjust > 0 ? 'text-ink' : 'text-ink-soft'
        }`}
      >
        {adjust > 0 ? '+' : ''}
        {adjust}%
      </span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="shrink-0 text-sm text-primary underline underline-offset-4"
      >
        Editar
      </button>
    </div>
  );
}

export default function PaymentMethods({ methods = [] }) {
  const [adding, setAdding] = useState(false);

  return (
    <div>
      {methods.length > 0 && (
        <div className="divide-y divide-line rounded-card border border-line bg-card">
          {methods.map((m) => (
            <Row key={m.id} method={m} />
          ))}
        </div>
      )}

      <div className="mt-4">
        {adding ? (
          <MethodForm method={null} onDone={() => setAdding(false)} />
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <Plus size={14} /> Agregar forma de pago
          </button>
        )}
      </div>
    </div>
  );
}
