'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import AttributeDefinitionForm from './AttributeDefinitionForm';

export default function NewAttributeDefinition() {
  const [open, setOpen] = useState(false);

  if (open) return <AttributeDefinitionForm definition={null} onDone={() => setOpen(false)} />;

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="inline-flex items-center gap-2 rounded-pill bg-primary px-5 py-2.5 text-sm font-medium text-on-dark hover:opacity-90"
    >
      <Plus size={16} /> Nueva referencia
    </button>
  );
}
