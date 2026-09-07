'use client';

import { Printer } from 'lucide-react';

export default function PrintButton({ children = 'Imprimir' }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-pill bg-primary px-5 py-2.5 text-sm font-medium text-on-dark transition-opacity hover:opacity-90"
    >
      <Printer size={16} strokeWidth={1.75} />
      {children}
    </button>
  );
}
