'use client';

import { useState } from 'react';
import ReferenceIcon from '@/components/icons/ReferenceIcon';
import AttributeDefinitionForm from './AttributeDefinitionForm';

const KIND_LABEL = {
  scale: 'Escala',
  single: 'Una opcion',
  multi: 'Varias opciones',
  text: 'Texto libre',
};

export default function AttributeDefinitionCard({ definition }) {
  const [editing, setEditing] = useState(false);
  const options = Array.isArray(definition.options) ? definition.options : [];

  if (editing) {
    return <AttributeDefinitionForm definition={definition} onDone={() => setEditing(false)} />;
  }

  return (
    <div className="rounded-card border border-line bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-xl leading-none text-ink">{definition.label}</p>
          <p className="mt-1 text-xs text-ink-soft">
            {KIND_LABEL[definition.kind] ?? definition.kind} · {definition.key}
            {!definition.is_active && ' · inactiva'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-sm text-primary underline underline-offset-4"
        >
          Editar
        </button>
      </div>

      {options.length > 0 && (
        <ul className="mt-4 flex flex-wrap items-end gap-6">
          {options.map((option) => (
            <li key={option.value} className="flex flex-col items-center gap-1.5">
              <span className="text-primary">
                <ReferenceIcon name={option.icon} size={28} />
              </span>
              <span className="caption text-[0.7rem] text-ink-soft">{option.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
