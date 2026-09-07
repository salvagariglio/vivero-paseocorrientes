'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdminContext, requireRole } from '@/lib/auth';
import { tenantTag } from '@/lib/queries';
import { slugify } from '@/lib/format';
import { ROOT_DOMAIN } from '@/lib/config';
import { resolveTheme, THEME_TOKENS, TYPESET_KEYS, DEFAULT_TYPESET } from '@/lib/theme';
import { CONTENT_KEYS } from '@/lib/content';
import { instagramHandle } from '@/lib/contact';
import {
  IMPORT_FIELDS,
  ROUNDINGS,
  DEFAULT_ROUNDING,
  resolveColumns,
  buildPriceDiff,
} from '@/lib/price-import';
import { adminCategoryTree, flattenTree } from '@/lib/admin-queries';

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
    allow_discount: bool(formData, 'allow_discount'),
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
/* Lista de precios                                                    */
/* ------------------------------------------------------------------ */

/**
 * Lee la planilla y la compara con el catalogo. No escribe nada:
 * devuelve el detalle para que la persona lo mire antes de aplicar.
 */
export async function previewPriceImport(_prev, formData) {
  const { tenant, supabase } = await requireAdminContext();

  const file = formData.get('file');
  if (!file || typeof file.arrayBuffer !== 'function' || file.size === 0) {
    return fail('Elegí la planilla que querés subir.');
  }
  if (file.size > 8 * 1024 * 1024) {
    return fail('La planilla pesa más de 8 MB. Guardala como .xlsx desde Excel.');
  }

  // Solo aca: el lector usa node:zlib y no tiene por que cargarse
  // en el resto de las acciones del panel.
  const { readSheet } = await import('@/lib/xlsx');

  let rows;
  try {
    rows = readSheet(Buffer.from(await file.arrayBuffer()));
  } catch (error) {
    return fail(error.message || 'No pudimos leer la planilla.');
  }

  const headers = (rows[0] ?? []).map((value) => String(value ?? '').trim());
  if (headers.every((header) => !header)) {
    return fail('La primera fila de la planilla tiene que ser el encabezado de las columnas.');
  }

  // Lo que el vivero eligio la vez pasada; si esa columna ya no esta, se
  // vuelve a adivinar por alias.
  const saved = tenant.settings?.price_import ?? {};
  const chosen = Object.fromEntries(
    IMPORT_FIELDS.map(({ key }) => [key, text(formData, `column.${key}`)]).filter(([, v]) => v)
  );
  const columns = resolveColumns(headers, { ...(saved.columns ?? {}), ...chosen });

  const rounding = ROUNDINGS.some((r) => r.value === text(formData, 'rounding'))
    ? text(formData, 'rounding')
    : saved.rounding ?? DEFAULT_ROUNDING;

  if (!columns.price) {
    return {
      ok: false,
      message: 'No encontramos la columna de precios. Elegila abajo y volvé a previsualizar.',
      headers,
      columns,
      rounding,
      filename: file.name,
    };
  }

  const [{ data: products, error }, tree] = await Promise.all([
    supabase.from('products').select('id, sku, slug, name, price').eq('tenant_id', tenant.id),
    adminCategoryTree(supabase, tenant.id),
  ]);

  if (error) return fail(error.message);

  const categories = flattenTree(tree);
  const diff = buildPriceDiff({
    rows,
    products: products ?? [],
    categories,
    columns,
    rounding,
    categoryMap: saved.categories ?? {},
  });
  if (diff.total === 0) {
    return { ...fail('La planilla no tiene filas debajo del encabezado.'), headers, columns, rounding };
  }

  return {
    ok: true,
    filename: file.name,
    headers,
    columns,
    rounding,
    // Para que la persona corrija a que categoria va cada alta.
    categories: categories.map((c) => ({ slug: c.slug, name: c.name, depth: c.depth })),
    counts: diff.counts,
    total: diff.total,
    items: diff.items,
    absent: diff.absent.map((p) => ({ id: p.id, name: p.name, sku: p.sku, price: p.price })),
    duplicates: diff.duplicates.map((group) => ({
      name: group[0].name,
      lines: group.map((item) => item.line),
    })),
  };
}

/** Escribe: un solo RPC, una sola transaccion, y solo la columna price. */
export async function applyPriceImport(_prev, formData) {
  const { tenant, supabase } = await requireAdminContext();

  let items = [];
  let columns = {};
  let categories = {};
  try {
    items = JSON.parse(text(formData, 'items') || '[]');
    columns = JSON.parse(text(formData, 'columns') || '{}');
    categories = JSON.parse(text(formData, 'categories') || '{}');
  } catch {
    return fail('Se perdió la previsualización. Volvé a subir la planilla.');
  }
  if (!Array.isArray(items) || items.length === 0) {
    return fail('No hay nada para aplicar. Volvé a subir la planilla.');
  }

  const rounding = ROUNDINGS.some((r) => r.value === text(formData, 'rounding'))
    ? text(formData, 'rounding')
    : DEFAULT_ROUNDING;

  const { data, error } = await supabase.rpc('apply_price_import', {
    p_tenant: tenant.id,
    p_filename: text(formData, 'filename'),
    p_mapping: { columns, rounding },
    p_rows: items.map((item) => ({
      product_id: item.productId,
      sku: item.sku,
      slug: item.slug,
      name: item.name,
      scientific: item.scientific,
      envase: item.envase,
      category_slug: item.categorySlug,
      price: item.price,
      outcome: item.outcome,
    })),
    p_create_new: bool(formData, 'create_new'),
    p_absent: num(formData, 'absent') ?? 0,
  });

  if (error) return fail(error.message);

  // El mapeo que funciono queda como default del vivero para la proxima.
  await supabase
    .from('tenant_settings')
    .upsert({ tenant_id: tenant.id, price_import: { columns, rounding, categories } });

  refresh(tenant.id);
  revalidatePath('/admin/precios');

  const created = Number(data?.created) || 0;
  return {
    ok: true,
    applied: true,
    message: created
      ? `Listo: ${data.changed} precios actualizados y ${created} plantas nuevas cargadas sin publicar.`
      : `Listo: ${data.changed} precios actualizados.`,
  };
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
    // El icono es solo de familia: una subcategoria se distingue por nombre.
    icon: parentId ? null : text(formData, 'icon'),
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
    logo_dark_url: text(formData, 'logo_dark_url'),
    favicon_url: text(formData, 'favicon_url'),
    cover_url: text(formData, 'cover_url'),
    tagline: text(formData, 'tagline'),
    about: text(formData, 'about'),
    theme,
    content: Object.fromEntries(
      CONTENT_KEYS.map(({ key }) => [key, text(formData, `content.${key}`)]).filter(([, v]) => v)
    ),
    typeset: TYPESET_KEYS.includes(text(formData, 'typeset'))
      ? text(formData, 'typeset')
      : DEFAULT_TYPESET,
    currency: text(formData, 'currency') || 'ARS',
    locale: text(formData, 'locale') || 'es-AR',
    show_prices: bool(formData, 'show_prices'),
    whatsapp: text(formData, 'whatsapp'),
    whatsapp_message: text(formData, 'whatsapp_message'),
    // Pegan el link que comparte la app: se guarda solo el usuario.
    instagram: instagramHandle({ instagram: text(formData, 'instagram') }),
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

/* ------------------------------------------------------------------ */
/* Formas de pago                                                      */
/* ------------------------------------------------------------------ */

export async function savePaymentMethod(_prev, formData) {
  const { tenant, supabase } = await requireAdminContext();

  const id = text(formData, 'id');
  const name = text(formData, 'name');
  if (!name) return fail('Poné un nombre para la forma de pago.');

  const adjust = num(formData, 'adjust_pct') ?? 0;
  if (adjust < -100 || adjust > 100) {
    return fail('El ajuste tiene que estar entre -100 y 100.');
  }

  const payload = {
    tenant_id: tenant.id,
    name,
    adjust_pct: adjust,
    position: num(formData, 'position') ?? 0,
    is_active: bool(formData, 'is_active'),
  };

  const query = id
    ? supabase.from('payment_methods').update(payload).eq('id', id).eq('tenant_id', tenant.id)
    : supabase.from('payment_methods').insert(payload);

  const { error } = await query;
  if (error) return fail(error.message);

  revalidatePath('/admin/ajustes');
  revalidatePath('/admin/presupuestos');
  return { ok: true, message: 'Forma de pago guardada.' };
}

export async function deletePaymentMethod(formData) {
  const { tenant, supabase } = await requireAdminContext();
  const id = text(formData, 'id');
  if (!id) return;

  await supabase.from('payment_methods').delete().eq('id', id).eq('tenant_id', tenant.id);
  revalidatePath('/admin/ajustes');
}

/* ------------------------------------------------------------------ */
/* Presupuestos                                                        */
/* ------------------------------------------------------------------ */

export async function saveQuote(_prev, formData) {
  const { tenant, supabase, user } = await requireAdminContext();

  const id = text(formData, 'id');

  let items = [];
  try {
    items = JSON.parse(text(formData, 'items') || '[]');
  } catch {
    return fail('No pudimos leer los ítems del presupuesto.');
  }
  if (!Array.isArray(items) || items.length === 0) {
    return fail('Agregá al menos una planta al presupuesto.');
  }

  // La forma de pago se copia al presupuesto: si manana cambia el
  // porcentaje, este documento sigue valiendo lo que decia.
  const methodId = text(formData, 'payment_method_id');
  let methodName = null;
  let methodAdjust = 0;
  if (methodId) {
    const { data: method } = await supabase
      .from('payment_methods')
      .select('name, adjust_pct')
      .eq('id', methodId)
      .eq('tenant_id', tenant.id)
      .maybeSingle();
    if (method) {
      methodName = method.name;
      methodAdjust = Number(method.adjust_pct) || 0;
    }
  }

  const payload = {
    tenant_id: tenant.id,
    status: text(formData, 'status') || 'borrador',
    customer_name: text(formData, 'customer_name'),
    customer_phone: text(formData, 'customer_phone'),
    customer_email: text(formData, 'customer_email'),
    payment_method_id: methodId,
    payment_method_name: methodName,
    payment_adjust_pct: methodAdjust,
    discount_pct: num(formData, 'discount_pct') ?? 0,
    notes: text(formData, 'notes'),
    valid_days: num(formData, 'valid_days') ?? 15,
  };

  let quoteId = id;

  if (id) {
    const { error } = await supabase
      .from('quotes')
      .update(payload)
      .eq('id', id)
      .eq('tenant_id', tenant.id);
    if (error) return fail(error.message);
  } else {
    const { data: number } = await supabase.rpc('next_quote_number', { p_tenant: tenant.id });
    const { data, error } = await supabase
      .from('quotes')
      .insert({ ...payload, number: number ?? 1, created_by: user.id })
      .select('id')
      .single();
    if (error) {
      if (error.code === '23505') return fail('Se generaron dos presupuestos a la vez. Probá de nuevo.');
      return fail(error.message);
    }
    quoteId = data.id;
  }

  await supabase.from('quote_items').delete().eq('quote_id', quoteId);

  const rows = items
    .filter((i) => i?.name && Number(i.qty) > 0)
    .map((item, index) => ({
      tenant_id: tenant.id,
      quote_id: quoteId,
      product_id: item.product_id ?? null,
      name: String(item.name).slice(0, 200),
      detail: item.detail ? String(item.detail).slice(0, 200) : null,
      unit_price: Number(item.unit_price) || 0,
      qty: Number(item.qty) || 1,
      allow_discount: item.allow_discount !== false,
      position: index,
    }));

  const { error: itemsError } = await supabase.from('quote_items').insert(rows);
  if (itemsError) return fail(itemsError.message);

  revalidatePath('/admin/presupuestos');
  redirect(`/admin/presupuestos/${quoteId}?guardado=1`);
}

export async function updateQuoteStatus(formData) {
  const { tenant, supabase } = await requireAdminContext();
  const id = text(formData, 'id');
  const status = text(formData, 'status');

  await supabase
    .from('quotes')
    .update({ status })
    .eq('id', id)
    .eq('tenant_id', tenant.id);

  revalidatePath('/admin/presupuestos');
  revalidatePath(`/admin/presupuestos/${id}`);
}

export async function deleteQuote(formData) {
  const { tenant, supabase } = await requireAdminContext();
  const id = text(formData, 'id');
  if (!id) return;

  await supabase.from('quotes').delete().eq('id', id).eq('tenant_id', tenant.id);
  revalidatePath('/admin/presupuestos');
  redirect('/admin/presupuestos');
}

/** Una consulta del sitio pasa a presupuesto y recien ahi toma numero. */
export async function promoteQuote(formData) {
  const { supabase } = await requireAdminContext();
  const id = text(formData, 'id');
  if (!id) return;

  await supabase.rpc('promote_quote_request', { p_quote: id });

  revalidatePath('/admin/presupuestos');
  revalidatePath(`/admin/presupuestos/${id}`);
}
