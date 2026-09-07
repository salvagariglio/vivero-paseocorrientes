/**
 * Calculo de un presupuesto. Funcion pura: las mismas entradas dan
 * siempre el mismo total, asi que el panel puede calcular en vivo y la
 * hoja impresa llega al mismo numero sin guardar totales duplicados.
 *
 * El orden importa:
 *   1. subtotal de los items
 *   2. descuento general, SOLO sobre los que lo admiten
 *   3. ajuste por forma de pago, sobre el neto ya descontado
 */

const money = (n) => Math.round((Number(n) || 0) * 100) / 100;

export function lineTotal(item) {
  return money((Number(item?.unit_price) || 0) * (Number(item?.qty) || 0));
}

export function calculateQuote(items = [], { discountPct = 0, paymentAdjustPct = 0 } = {}) {
  const discount = Math.min(Math.max(Number(discountPct) || 0, 0), 100);
  const adjust = Math.min(Math.max(Number(paymentAdjustPct) || 0, -100), 100);

  let subtotal = 0;
  let discountable = 0;
  let firmCount = 0;

  for (const item of items) {
    const total = lineTotal(item);
    subtotal += total;
    if (item?.allow_discount === false) firmCount += 1;
    else discountable += total;
  }

  subtotal = money(subtotal);
  const discountAmount = money((discountable * discount) / 100);
  const net = money(subtotal - discountAmount);
  const adjustAmount = money((net * adjust) / 100);

  return {
    items: items.length,
    units: items.reduce((acc, i) => acc + (Number(i?.qty) || 0), 0),
    subtotal,
    discountPct: discount,
    discountAmount,
    /** Cuantos items quedaron fuera del descuento por ser precio firme. */
    firmCount,
    net,
    adjustPct: adjust,
    adjustAmount,
    total: money(net + adjustAmount),
  };
}

/** Fecha hasta la que vale el presupuesto. */
export function validUntil(createdAt, validDays) {
  const days = Number(validDays);
  if (!Number.isFinite(days) || days <= 0) return null;
  const base = createdAt ? new Date(createdAt) : new Date();
  base.setDate(base.getDate() + days);
  return base;
}

export const QUOTE_STATUS = [
  { value: 'solicitud', label: 'Consulta del sitio' },
  { value: 'borrador', label: 'Borrador' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'aceptado', label: 'Aceptado' },
  { value: 'rechazado', label: 'Rechazado' },
  { value: 'vencido', label: 'Vencido' },
];

export function statusLabel(value) {
  return QUOTE_STATUS.find((s) => s.value === value)?.label ?? value;
}

/** Una consulta del sitio todavia no tiene numero correlativo. */
export function isRequest(quote) {
  return quote?.source === 'sitio' && Number(quote?.number) < 0;
}

export function quoteLabel(quote) {
  return isRequest(quote) ? 'Consulta' : `#${quote?.number}`;
}
