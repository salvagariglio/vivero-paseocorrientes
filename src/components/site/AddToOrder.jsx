'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Plus } from 'lucide-react';
import { useOrder } from './OrderProvider';

/**
 * Suma una planta a la consulta de presupuesto. No muestra ni suma
 * precios: el numero lo pone el vivero cuando cotiza.
 */
export default function AddToOrder({ product, className = '' }) {
  const order = useOrder();
  const [justAdded, setJustAdded] = useState(false);

  const already = order.has(product.id);

  function add() {
    order.add(product);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 2200);
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={add}
        className="inline-flex w-fit items-center gap-2 rounded-pill border border-primary/30 px-6 py-3 text-sm font-medium text-primary-deep transition-colors hover:border-primary"
      >
        {already ? <Check size={16} strokeWidth={2} /> : <Plus size={16} strokeWidth={2} />}
        {already ? 'Sumar otra a la consulta' : 'Sumar a mi consulta'}
      </button>

      {(justAdded || already) && (
        <p className="mt-2.5 text-sm text-earth">
          {order.count} {order.count === 1 ? 'planta' : 'plantas'} en tu consulta ·{' '}
          <Link href="/pedido" className="text-primary underline underline-offset-4">
            revisar y enviar
          </Link>
        </p>
      )}
    </div>
  );
}
