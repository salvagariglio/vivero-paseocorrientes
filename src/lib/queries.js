import { unstable_cache } from 'next/cache';
import { createSupabasePublicClient } from '@/lib/supabase/server';
import { buildCategoryTree, categoryBranchIds } from '@/lib/format';

const PRODUCT_FIELDS = `
  id, name, slug, scientific_name, short_description, description,
  price, promo_price, promo_label, promo_starts_at, promo_ends_at,
  sku, stock, image_url, attributes, is_active, is_featured, position,
  category_id
`;

/* --------------------------------------------------------------------
 * Todas las lecturas publicas van filtradas por tenant_id y cacheadas
 * por tenant. Invalidar con revalidateTag(`tenant:${id}`).
 * ------------------------------------------------------------------ */

export function tenantTag(tenantId) {
  return `tenant:${tenantId}`;
}

export const getCategories = (tenantId) =>
  unstable_cache(
    async () => {
      const supabase = createSupabasePublicClient();
      const { data, error } = await supabase
        .from('categories')
        .select('id, parent_id, name, slug, description, image_url, icon, position, is_active')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('position', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    ['categories', tenantId],
    { revalidate: 120, tags: [tenantTag(tenantId)] }
  )();

export async function getCategoryTree(tenantId) {
  return buildCategoryTree(await getCategories(tenantId));
}

export const getProducts = (tenantId, options = {}) =>
  unstable_cache(
    async () => {
      const supabase = createSupabasePublicClient();
      let query = supabase
        .from('products')
        .select(PRODUCT_FIELDS)
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (options.categoryIds?.length) query = query.in('category_id', options.categoryIds);
      if (options.featured) query = query.eq('is_featured', true);
      if (options.search) {
        const q = options.search.replace(/[%,()]/g, ' ').trim();
        query = query.or(
          `name.ilike.%${q}%,scientific_name.ilike.%${q}%,short_description.ilike.%${q}%`
        );
      }
      if (options.limit) query = query.limit(options.limit);

      const { data, error } = await query
        .order('position', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    ['products', tenantId, JSON.stringify(options)],
    { revalidate: 120, tags: [tenantTag(tenantId)] }
  )();

/** Productos de una categoria incluyendo los de sus subcategorias. */
export async function getProductsInBranch(tenantId, categoryId) {
  const tree = await getCategoryTree(tenantId);
  const ids = categoryBranchIds(tree, categoryId);
  if (!ids.length) return [];
  return getProducts(tenantId, { categoryIds: ids });
}

export const getProductBySlug = (tenantId, slug) =>
  unstable_cache(
    async () => {
      const supabase = createSupabasePublicClient();
      const { data, error } = await supabase
        .from('products')
        .select(`${PRODUCT_FIELDS}, category:categories(id, name, slug, parent_id)`)
        .eq('tenant_id', tenantId)
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const { data: images } = await supabase
        .from('product_images')
        .select('id, url, alt, position')
        .eq('product_id', data.id)
        .order('position', { ascending: true });

      return { ...data, images: images ?? [] };
    },
    ['product', tenantId, slug],
    { revalidate: 120, tags: [tenantTag(tenantId)] }
  )();

export const getCategoryBySlug = (tenantId, slug) =>
  unstable_cache(
    async () => {
      const supabase = createSupabasePublicClient();
      const { data, error } = await supabase
        .from('categories')
        .select('id, parent_id, name, slug, description, image_url')
        .eq('tenant_id', tenantId)
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    ['category', tenantId, slug],
    { revalidate: 120, tags: [tenantTag(tenantId)] }
  )();

/** Referencias del vivero (riego, sol, ubicacion...) con sus opciones. */
export const getAttributeDefinitions = (tenantId) =>
  unstable_cache(
    async () => {
      const supabase = createSupabasePublicClient();
      const { data, error } = await supabase
        .from('attribute_definitions')
        .select('id, key, label, help, kind, options, position, show_on_label, show_on_card')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('position', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    ['attribute-definitions', tenantId],
    { revalidate: 120, tags: [tenantTag(tenantId)] }
  )();

/** Cuantas plantas publicadas hay por categoria. Se suma por rama en la vista. */
export const getProductCountsByCategory = (tenantId) =>
  unstable_cache(
    async () => {
      const supabase = createSupabasePublicClient();
      const { data, error } = await supabase
        .from('products')
        .select('category_id')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);
      if (error) throw error;

      const counts = {};
      for (const row of data ?? []) {
        if (!row.category_id) continue;
        counts[row.category_id] = (counts[row.category_id] ?? 0) + 1;
      }
      return counts;
    },
    ['category-counts', tenantId],
    { revalidate: 120, tags: [tenantTag(tenantId)] }
  )();
