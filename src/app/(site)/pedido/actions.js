'use server';

import { createSupabasePublicClient } from '@/lib/supabase/server';
import { getTenant } from '@/lib/tenant';

/**
 * Envia la consulta del cliente. No calcula ni recibe precios: manda
 * solo que planta y cuanta. La funcion en Postgres valida el resto y
 * decide ella los valores sensibles.
 */
export async function submitQuoteRequest(_prev, formData) {
  const tenant = await getTenant();
  if (!tenant) {
    return { ok: false, message: 'No pudimos identificar el vivero.' };
  }

  const text = (key, max) => {
    const value = formData.get(key);
    return value ? String(value).trim().slice(0, max) : null;
  };

  let items = [];
  try {
    items = JSON.parse(formData.get('items') || '[]');
  } catch {
    return { ok: false, message: 'No pudimos leer tu lista. Probá de nuevo.' };
  }

  // Solo viaja el id y la cantidad: cualquier otra cosa se descarta.
  const clean = (Array.isArray(items) ? items : [])
    .map((i) => ({ product_id: i?.product_id, qty: Number(i?.qty) || 0 }))
    .filter((i) => i.product_id && i.qty > 0);

  if (clean.length === 0) {
    return { ok: false, message: 'Tu lista está vacía.' };
  }

  const supabase = createSupabasePublicClient();
  const { error } = await supabase.rpc('submit_quote_request', {
    p_tenant: tenant.id,
    p_name: text('name', 120),
    p_phone: text('phone', 60),
    p_email: text('email', 160),
    p_message: text('message', 1000),
    p_items: clean,
  });

  if (error) {
    return { ok: false, message: error.message || 'No pudimos enviar tu consulta.' };
  }

  return {
    ok: true,
    message: 'Recibimos tu consulta. Te vamos a pasar el presupuesto por WhatsApp.',
  };
}
