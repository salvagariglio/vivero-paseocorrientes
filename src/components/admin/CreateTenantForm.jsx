'use client';

import { useActionState } from 'react';
import { createTenant } from '@/app/admin/actions';
import { Field, Input, SubmitButton, FormStatus } from './Form';

export default function CreateTenantForm({ rootDomain }) {
  const [state, formAction] = useActionState(createTenant, null);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <Field label="Nombre del vivero">
        <Input name="name" required placeholder="Vivero Luz" />
      </Field>

      <Field label="Direccion web" hint={`Va a quedar como tu-vivero.${rootDomain}`}>
        <Input name="slug" required placeholder="vivero-luz" />
      </Field>

      <div className="flex flex-wrap items-center gap-4 pt-2">
        <SubmitButton>Crear vivero</SubmitButton>
        <FormStatus state={state} />
      </div>

      {state?.ok && state.host && (
        <p className="text-sm text-ink-soft">
          Entra a{' '}
          <a
            href={`https://${state.host}/admin`}
            className="text-primary underline underline-offset-4"
          >
            {state.host}/admin
          </a>{' '}
          para cargar el catalogo.
        </p>
      )}
    </form>
  );
}
