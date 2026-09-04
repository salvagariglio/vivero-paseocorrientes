'use client';

import { useActionState } from 'react';
import { inviteMember } from '@/app/admin/actions';
import { Field, Input, Select, SubmitButton, FormStatus } from './Form';

export default function InviteForm() {
  const [state, formAction] = useActionState(inviteMember, null);

  return (
    <form action={formAction} className="mt-6 flex flex-wrap items-end gap-3">
      <Field label="Invitar por email" className="min-w-56 flex-1">
        <Input name="email" type="email" required placeholder="persona@vivero.com" />
      </Field>
      <Field label="Rol">
        <Select name="role" defaultValue="editor">
          <option value="editor">Editor</option>
          <option value="admin">Administrador</option>
        </Select>
      </Field>
      <SubmitButton>Invitar</SubmitButton>
      <div className="basis-full">
        <FormStatus state={state} />
      </div>
    </form>
  );
}
