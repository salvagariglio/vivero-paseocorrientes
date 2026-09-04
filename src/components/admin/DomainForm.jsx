'use client';

import { useActionState } from 'react';
import { addDomain } from '@/app/admin/actions';
import { Field, Input, SubmitButton, FormStatus } from './Form';

export default function DomainForm() {
  const [state, formAction] = useActionState(addDomain, null);

  return (
    <form action={formAction} className="mt-6 flex flex-wrap items-end gap-3">
      <Field label="Agregar dominio propio" className="min-w-64 flex-1">
        <Input name="host" placeholder="viveroluz.com.ar" />
      </Field>
      <SubmitButton>Agregar</SubmitButton>
      <div className="basis-full">
        <FormStatus state={state} />
      </div>
    </form>
  );
}
