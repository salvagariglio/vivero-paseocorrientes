'use client';

import Link from 'next/link';
import { ClipboardList } from 'lucide-react';
import { useOrder } from './OrderProvider';

/** Acceso a la consulta en armado. Se esconde mientras esta vacia. */
export default function OrderLink() {
  const { count, loaded } = useOrder();
  if (!loaded || count === 0) return null;

  return (
    <Link
      href="/pedido"
      className="relative rounded-full p-2.5 text-ink transition-colors hover:bg-black/5"
      aria-label={`Mi consulta: ${count} ${count === 1 ? 'planta' : 'plantas'}`}
    >
      <ClipboardList size={19} strokeWidth={1.75} />
      <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-pill bg-accent px-1 text-[0.6rem] font-medium leading-4 text-on-dark">
        {count > 99 ? '99+' : count}
      </span>
    </Link>
  );
}
