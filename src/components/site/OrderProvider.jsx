'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

/**
 * La lista que arma el cliente antes de pedir presupuesto.
 *
 * Guarda solo que planta y cuanta: ningun precio. El total lo pone el
 * vivero cuando cotiza, asi que nada de plata pasa por aca.
 *
 * Vive en localStorage del visitante, con la clave separada por vivero
 * para que dos viveros en el mismo navegador no se mezclen.
 */
const OrderContext = createContext(null);

export function useOrder() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrder necesita estar dentro de OrderProvider');
  return ctx;
}

export default function OrderProvider({ tenantId, children }) {
  const storageKey = `pedido:${tenantId}`;
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Se lee despues del primer render para no romper la hidratacion.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setItems(parsed.filter((i) => i?.product_id && i?.qty > 0));
    } catch {
      /* navegador sin storage o dato corrupto: se arranca vacio */
    }
    setLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      /* modo privado: la lista igual funciona en esta pestana */
    }
  }, [items, loaded, storageKey]);

  const value = useMemo(
    () => ({
      items,
      loaded,
      count: items.reduce((acc, i) => acc + (Number(i.qty) || 0), 0),
      has: (id) => items.some((i) => i.product_id === id),

      add(product, qty = 1) {
        setItems((prev) => {
          const found = prev.find((i) => i.product_id === product.id);
          if (found) {
            return prev.map((i) =>
              i.product_id === product.id ? { ...i, qty: Math.min(i.qty + qty, 9999) } : i
            );
          }
          return [
            ...prev,
            {
              product_id: product.id,
              name: product.name,
              slug: product.slug,
              detail: product.detail ?? null,
              qty,
            },
          ];
        });
      },

      setQty(id, qty) {
        const n = Math.max(0, Math.min(Number(qty) || 0, 9999));
        setItems((prev) =>
          n === 0
            ? prev.filter((i) => i.product_id !== id)
            : prev.map((i) => (i.product_id === id ? { ...i, qty: n } : i))
        );
      },

      remove(id) {
        setItems((prev) => prev.filter((i) => i.product_id !== id));
      },

      clear() {
        setItems([]);
      },
    }),
    [items, loaded]
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}
