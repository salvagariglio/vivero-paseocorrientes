'use server';

import { createSupabasePublicClient } from '@/lib/supabase/server';
import { getTenant } from '@/lib/tenant';

/**
 * Consulta de presupuesto desde el sitio: nombre, contacto y un mensaje
 * con lo que el cliente necesita. Nada de precios pasa por aca; el
 * numero lo arma el vivero en el panel.
 */
export async function submitConsulta(_prev, formData) {
  const tenant = await getTenant();
  if (!tenant) {
    return { ok: false, message: 'No pudimos identificar el vivero.' };
  }

  const text = (key, max) => {
    const value = formData.get(key);
    const trimmed = value ? String(value).trim() : '';
    return trimmed ? trimmed.slice(0, max) : null;
  };

  const name = text('name', 120);
  const phone = text('phone', 60);
  const message = text('message', 2000);

  if (!name) return { ok: false, message: 'Decinos tu nombre.' };
  if (!phone) return { ok: false, message: 'Dejanos un teléfono para responderte.' };
  if (!message) return { ok: false, message: 'Contanos qué necesitás.' };

  const supabase = createSupabasePublicClient();
  const { error } = await supabase.rpc('submit_quote_request', {
    p_tenant: tenant.id,
    p_name: name,
    p_phone: phone,
    p_email: text('email', 160),
    p_message: message,
    p_items: [],
  });

  if (error) {
    return { ok: false, message: error.message || 'No pudimos enviar tu consulta.' };
  }

  return { ok: true };
}
