'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdminContext, requireRole } from '@/lib/auth';
import { tenantTag } from '@/lib/queries';
import { slugify } from '@/lib/format';
import { ROOT_DOMAIN } from '@/lib/config';
import { resolveTheme, THEME_TOKENS, TYPESET_KEYS, DEFAULT_TYPESET } from '@/lib/theme';

/* Todas las escrituras pasan por RLS: aunque llegue otro tenant_id,
 * Postgres rechaza la fila si el usuario no es miembro. */

function refresh(tenantId) {
  revalidateTag(tenantTag(tenantId));
  revalidateTag('tenants');
  revalidatePath('/', 'layout');
}

function text(formData, key) {
  const value = formData.get(key);
  if (value === null) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
}

function num(formData, key) {
  const value = text(formData, key);
  if (value === null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function bool(formData, key) {
  return formData.get(key) === 'on' || formData.get(key) === 'true';
}

function fail(message) {
  return { ok: false, message };
}

/* ------------------------------------------------------------------ */
/* Productos                                                           */
/* ------------------------------------------------------------------ */

export async function saveProduct(_prev, formData) {
  const { tenant, supabase } = await requireAdminContext();

  const id = text(formData, 'id');
  const name = text(formData, 'name');
  if (!name) return fail('El nombre es obligatorio.');

  let attributes = {};
  const rawAttributes = text(formData, 'attributes');
  if (rawAttributes) {
    try {
      attributes = JSON.parse(rawAttributes);
    } catch {
      return fail('Los datos de cuidado no tienen un formato válido.');
    }
  }

  const payload = {
    tenant_id: tenant.id,
    name,
    slug: text(formData, 'slug') ? slugify(text(formData, 'slug')) : slugify(name),
    scientific_name: text(formData, 'scientific_name'),
    short_description: text(formData, 'short_description'),
    description: text(formData, 'description'),
    category_id: text(formData, 'category_id'),
    price: num(formData, 'price'),
    promo_price: num(formData, 'promo_price'),
    promo_label: text(formData, 'promo_label'),
    promo_starts_at: text(formData, 'promo_starts_at'),
    promo_ends_at: text(formData, 'promo_ends_at'),
    sku: text(formData, 'sku'),
    stock: num(formData, 'stock'),
    image_url: text(formData, 'image_url'),
    attributes,
    is_active: bool(formData, 'is_active'),
    is_featured: bool(formData, 'is_featured'),
    position: num(formData, 'position') ?? 0,
  };

  const query = id
    ? supabase.from('products').update(payload).eq('id', id).eq('tenant_id', tenant.id)
    : supabase.from('products').insert(payload);

  const { data, error } = await query.select('id, slug').single();

  if (error) {
    if (error.code === '23505') return fail('Ya existe otra planta con esa URL. Cambiá el slug.');
    return fail(error.message);
  }

  // Galeria: lista de URLs (una por linea) enviada por el uploader.
  const gallery = (text(formData, 'gallery') || '')
    .split('\n')
    .map((u) => u.trim())
    .filter(Boolean);

  await supabase.from('product_images').delete().eq('product_id', data.id);
  if (gallery.length) {
    await supabase.from('product_images').insert(
      gallery.map((url, i) => ({
        tenant_id: tenant.id,
        product_id: data.id,
        url,
        position: i,
      }))
    );
  }

  refresh(tenant.id);
  redirect(`/admin/productos?guardado=${data.slug}`);
}

export async function deleteProduct(formData) {
  const { tenant, supabase } = await requireAdminContext();
  const id = text(formData, 'id');
  if (!id) return;

  await supabase.from('products').delete().eq('id', id).eq('tenant_id', tenant.id);
  refresh(tenant.id);
  redirect('/admin/productos');
}

export async function toggleProductActive(formData) {
  const { tenant, supabase } = await requireAdminContext();
  const id = text(formData, 'id');
  const next = formData.get('next') === 'true';

  await supabase
    .from('products')
    .update({ is_active: next })
    .eq('id', id)
    .eq('tenant_id', tenant.id);

  refresh(tenant.id);
}

/* ------------------------------------------------------------------ */
/* Categorias                                                          */
/* ------------------------------------------------------------------ */

export async function saveCategory(_prev, formData) {
  const { tenant, supabase } = await requireAdminContext();

  const id = text(formData, 'id');
  const name = text(formData, 'name');
  if (!name) return fail('El nombre es obligatorio.');

  const parentId = text(formData, 'parent_id');
  if (id && parentId === id) return fail('Una categoría no puede colgar de sí misma.');

  const payload = {
    tenant_id: tenant.id,
    name,
    slug: text(formData, 'slug') ? slugify(text(formData, 'slug')) : slugify(name),
    description: text(formData, 'description'),
    image_url: text(formData, 'image_url'),
    parent_id: parentId,
    position: num(formData, 'position') ?? 0,
    is_active: bool(formData, 'is_active'),
  };

  const query = id
    ? supabase.from('categories').update(payload).eq('id', id).eq('tenant_id', tenant.id)
    : supabase.from('categories').insert(payload);

  const { error } = await query;
  if (error) {
    if (error.code === '23505') return fail('Ya existe otra categoría con esa URL.');
    return fail(error.message);
  }

  refresh(tenant.id);
  return { ok: true, message: 'Categoría guardada.' };
}

export async function deleteCategory(formData) {
  const { tenant, supabase } = await requireAdminContext();
  const id = text(formData, 'id');
  if (!id) return;

  await supabase.from('categories').delete().eq('id', id).eq('tenant_id', tenant.id);
  refresh(tenant.id);
  redirect('/admin/categorias');
}

/* ------------------------------------------------------------------ */
/* Marca y datos del vivero                                            */
/* ------------------------------------------------------------------ */

export async function saveSettings(_prev, formData) {
  const { tenant, supabase } = await requireAdminContext();

  const name = text(formData, 'name');
  if (name && name !== tenant.name) {
    await supabase.from('tenants').update({ name }).eq('id', tenant.id);
  }

  // Un campo por token; resolveTheme descarta lo que no sea hex y completa el resto.
  const theme = resolveTheme(
    Object.fromEntries(
      THEME_TOKENS.map(({ key }) => [key, text(formData, `theme.${key}`)]).filter(([, v]) => v)
    )
  );

  const payload = {
    tenant_id: tenant.id,
    logo_url: text(formData, 'logo_url'),
    favicon_url: text(formData, 'favicon_url'),
    cover_url: text(formData, 'cover_url'),
    tagline: text(formData, 'tagline'),
    about: text(formData, 'about'),
    theme,
    typeset: TYPESET_KEYS.includes(text(formData, 'typeset'))
      ? text(formData, 'typeset')
      : DEFAULT_TYPESET,
    currency: text(formData, 'currency') || 'ARS',
    locale: text(formData, 'locale') || 'es-AR',
    show_prices: bool(formData, 'show_prices'),
    whatsapp: text(formData, 'whatsapp'),
    instagram: text(formData, 'instagram'),
    email: text(formData, 'email'),
    phone: text(formData, 'phone'),
    address: text(formData, 'address'),
    maps_url: text(formData, 'maps_url'),
    opening_hours: text(formData, 'opening_hours'),
  };

  const { error } = await supabase.from('tenant_settings').upsert(payload);
  if (error) return fail(error.message);

  refresh(tenant.id);
  return { ok: true, message: 'Cambios guardados.' };
}

/* ------------------------------------------------------------------ */
/* Dominios                                                            */
/* ------------------------------------------------------------------ */

export async function addDomain(_prev, formData) {
  const { tenant, supabase } = await requireRole('admin');

  const host = (text(formData, 'host') || '')
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '');

  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(host) && !host.endsWith('.localhost')) {
    return fail('Ingresá un dominio válido, por ejemplo viveroluz.com.ar');
  }

  const { error } = await supabase
    .from('tenant_domains')
    .insert({ tenant_id: tenant.id, host, is_primary: false });

  if (error) {
    if (error.code === '23505') return fail('Ese dominio ya está en uso.');
    return fail(error.message);
  }

  refresh(tenant.id);
  return { ok: true, message: `Agregamos ${host}. Apuntá el DNS a Vercel para activarlo.` };
}

export async function setPrimaryDomain(formData) {
  const { tenant, supabase } = await requireRole('admin');
  const id = text(formData, 'id');

  await supabase
    .from('tenant_domains')
    .update({ is_primary: false })
    .eq('tenant_id', tenant.id)
    .eq('is_primary', true);

  await supabase
    .from('tenant_domains')
    .update({ is_primary: true })
    .eq('id', id)
    .eq('tenant_id', tenant.id);

  refresh(tenant.id);
}

export async function deleteDomain(formData) {
  const { tenant, supabase } = await requireRole('admin');
  const id = text(formData, 'id');

  await supabase.from('tenant_domains').delete().eq('id', id).eq('tenant_id', tenant.id);
  refresh(tenant.id);
}

/* ------------------------------------------------------------------ */
/* Equipo                                                              */
/* ------------------------------------------------------------------ */

export async function inviteMember(_prev, formData) {
  const { tenant, supabase, user } = await requireRole('admin');

  const email = text(formData, 'email')?.toLowerCase();
  const role = text(formData, 'role') || 'editor';
  if (!email) return fail('Falta el email.');

  const { error } = await supabase
    .from('tenant_invites')
    .upsert(
      { tenant_id: tenant.id, email, role, invited_by: user.id, accepted_at: null },
      { onConflict: 'tenant_id,email' }
    );

  if (error) return fail(error.message);
  return {
    ok: true,
    message: `Invitamos a ${email}. Se suma al vivero cuando cree su cuenta y entre.`,
  };
}

export async function updateMemberRole(formData) {
  const { tenant, supabase } = await requireRole('admin');
  const userId = text(formData, 'user_id');
  const role = text(formData, 'role');

  await supabase
    .from('memberships')
    .update({ role })
    .eq('tenant_id', tenant.id)
    .eq('user_id', userId);

  revalidatePath('/admin/equipo');
}

export async function removeMember(formData) {
  const { tenant, supabase } = await requireRole('admin');
  const userId = text(formData, 'user_id');

  await supabase.from('memberships').delete().eq('tenant_id', tenant.id).eq('user_id', userId);
  revalidatePath('/admin/equipo');
}

export async function cancelInvite(formData) {
  const { tenant, supabase } = await requireRole('admin');
  const id = text(formData, 'id');

  await supabase.from('tenant_invites').delete().eq('id', id).eq('tenant_id', tenant.id);
  revalidatePath('/admin/equipo');
}

/* ------------------------------------------------------------------ */
/* Etiquetas                                                           */
/* ------------------------------------------------------------------ */

export async function saveLabelTemplate(_prev, formData) {
  const { tenant, supabase } = await requireAdminContext();

  const id = text(formData, 'id');
  const payload = {
    tenant_id: tenant.id,
    name: text(formData, 'name') || 'Etiqueta',
    width_mm: num(formData, 'width_mm') ?? 50,
    height_mm: num(formData, 'height_mm') ?? 80,
    qr_mm: num(formData, 'qr_mm') ?? 22,
    gap_mm: num(formData, 'gap_mm') ?? 4,
    margin_mm: num(formData, 'margin_mm') ?? 8,
    page_size: text(formData, 'page_size') || 'A4',
    show_logo: bool(formData, 'show_logo'),
    show_price: bool(formData, 'show_price'),
    show_description: bool(formData, 'show_description'),
    show_scientific: bool(formData, 'show_scientific'),
    bg_token: text(formData, 'bg_token') || 'card',
    fg_token: text(formData, 'fg_token') || 'ink',
    accent_token: text(formData, 'accent_token') || 'accent',
  };

  const query = id
    ? supabase.from('label_templates').update(payload).eq('id', id).eq('tenant_id', tenant.id)
    : supabase.from('label_templates').insert(payload);

  const { error } = await query;
  if (error) return fail(error.message);

  revalidatePath('/admin/etiquetas');
  return { ok: true, message: 'Plantilla guardada.' };
}

/* ------------------------------------------------------------------ */
/* Alta de vivero                                                      */
/* ------------------------------------------------------------------ */

export async function createTenant(_prev, formData) {
  const { createSupabaseServerClient } = await import('@/lib/supabase/server');
  const supabase = await createSupabaseServerClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect('/admin/login');

  const name = text(formData, 'name');
  const slug = slugify(text(formData, 'slug') || name || '');
  if (!name || !slug) return fail('Necesitamos un nombre y una dirección para el vivero.');

  const { error } = await supabase.rpc('create_tenant', {
    p_slug: slug,
    p_name: name,
    p_root_domain: ROOT_DOMAIN.split(':')[0],
  });

  if (error) {
    if (error.code === '23505') return fail('Esa dirección ya está tomada. Probá otra.');
    return fail(error.message);
  }

  revalidateTag('tenants');
  return {
    ok: true,
    message: `Listo. Tu vivero vive en ${slug}.${ROOT_DOMAIN}`,
    host: `${slug}.${ROOT_DOMAIN}`,
  };
}

/* ------------------------------------------------------------------ */
/* Referencias                                                         */
/* ------------------------------------------------------------------ */

export async function saveAttributeDefinition(_prev, formData) {
  const { tenant, supabase } = await requireAdminContext();

  const id = text(formData, 'id');
  const label = text(formData, 'label');
  if (!label) return fail('Poné un nombre para la referencia.');

  let options = [];
  const raw = text(formData, 'options');
  if (raw) {
    try {
      options = JSON.parse(raw);
    } catch {
      return fail('Las opciones no tienen un formato válido.');
    }
  }

  const kind = text(formData, 'kind') || 'scale';
  if (kind !== 'text' && options.length === 0) {
    return fail('Agregá al menos una opción.');
  }

  const payload = {
    tenant_id: tenant.id,
    key: text(formData, 'key') ? slugify(text(formData, 'key')) : slugify(label),
    label,
    help: text(formData, 'help'),
    kind,
    options,
    position: num(formData, 'position') ?? 0,
    show_on_label: bool(formData, 'show_on_label'),
    show_on_card: bool(formData, 'show_on_card'),
    is_active: bool(formData, 'is_active'),
  };

  const query = id
    ? supabase
        .from('attribute_definitions')
        .update(payload)
        .eq('id', id)
        .eq('tenant_id', tenant.id)
    : supabase.from('attribute_definitions').insert(payload);

  const { error } = await query;
  if (error) {
    if (error.code === '23505') return fail('Ya existe otra referencia con esa clave.');
    return fail(error.message);
  }

  refresh(tenant.id);
  revalidatePath('/admin/referencias');
  return { ok: true, message: 'Referencia guardada.' };
}

export async function deleteAttributeDefinition(formData) {
  const { tenant, supabase } = await requireAdminContext();
  const id = text(formData, 'id');
  if (!id) return;

  await supabase
    .from('attribute_definitions')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenant.id);

  refresh(tenant.id);
  redirect('/admin/referencias');
}
