import { buildCategoryTree } from '@/lib/format';

/** Categorias del tenant (incluye las despublicadas) como arbol. */
export async function adminCategoryTree(supabase, tenantId) {
  const { data } = await supabase
    .from('categories')
    .select('id, parent_id, name, slug, description, image_url, icon, position, is_active')
    .eq('tenant_id', tenantId)
    .order('position', { ascending: true });

  return buildCategoryTree(data ?? []);
}

/** Aplana el arbol para selects, conservando la profundidad. */
export function flattenTree(tree, depth = 0, out = []) {
  for (const node of tree) {
    out.push({ id: node.id, name: node.name, slug: node.slug, depth, is_active: node.is_active });
    if (node.children?.length) flattenTree(node.children, depth + 1, out);
  }
  return out;
}

export async function adminProducts(supabase, tenantId, { search } = {}) {
  let query = supabase
    .from('products')
    .select(
      'id, name, slug, scientific_name, price, promo_price, promo_starts_at, promo_ends_at, image_url, is_active, is_featured, position, category_id, stock'
    )
    .eq('tenant_id', tenantId);

  if (search) {
    const q = search.replace(/[%,()]/g, ' ').trim();
    query = query.or(`name.ilike.%${q}%,scientific_name.ilike.%${q}%,sku.ilike.%${q}%`);
  }

  const { data } = await query
    .order('position', { ascending: true })
    .order('name', { ascending: true });

  return data ?? [];
}

export async function adminProduct(supabase, tenantId, id) {
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', id)
    .maybeSingle();

  if (!data) return null;

  const { data: images } = await supabase
    .from('product_images')
    .select('id, url, alt, position')
    .eq('product_id', id)
    .order('position', { ascending: true });

  return { ...data, images: images ?? [] };
}

export async function adminLabelTemplates(supabase, tenantId) {
  const { data } = await supabase
    .from('label_templates')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('is_default', { ascending: false })
    .order('name', { ascending: true });

  return data ?? [];
}

export async function adminAttributeDefinitions(supabase, tenantId) {
  const { data } = await supabase
    .from('attribute_definitions')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('position', { ascending: true });

  return data ?? [];
}
