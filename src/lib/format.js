export function formatPrice(value, settings) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  try {
    return new Intl.NumberFormat(settings?.locale || 'es-AR', {
      style: 'currency',
      currency: settings?.currency || 'ARS',
      maximumFractionDigits: n % 1 === 0 ? 0 : 2,
    }).format(n);
  } catch {
    return `$${n}`;
  }
}

/** Promo activa = hay promo_price y estamos dentro de la ventana (si la hay). */
export function promoState(product, now = new Date()) {
  const price = product?.price != null ? Number(product.price) : null;
  const promo = product?.promo_price != null ? Number(product.promo_price) : null;

  if (promo == null || Number.isNaN(promo)) {
    return { active: false, price, effective: price, discount: null };
  }
  const starts = product.promo_starts_at ? new Date(product.promo_starts_at) : null;
  const ends = product.promo_ends_at ? new Date(product.promo_ends_at) : null;
  const inWindow = (!starts || now >= starts) && (!ends || now <= ends);

  if (!inWindow) return { active: false, price, effective: price, discount: null };

  const discount = price && price > 0 ? Math.round((1 - promo / price) * 100) : null;
  return { active: true, price, effective: promo, discount, label: product.promo_label };
}

export function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Arma el arbol de categorias a partir de la lista plana. */
export function buildCategoryTree(categories = []) {
  const byId = new Map();
  categories.forEach((c) => byId.set(c.id, { ...c, children: [] }));

  const roots = [];
  byId.forEach((node) => {
    if (node.parent_id && byId.has(node.parent_id)) byId.get(node.parent_id).children.push(node);
    else roots.push(node);
  });

  const sort = (list) => {
    list.sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
    list.forEach((n) => sort(n.children));
  };
  sort(roots);
  return roots;
}

/** Ids de una categoria y toda su descendencia. */
export function categoryBranchIds(tree, id) {
  const out = [];
  const collect = (n) => {
    out.push(n.id);
    n.children.forEach(collect);
  };
  const walk = (nodes) => {
    for (const n of nodes) {
      if (n.id === id) {
        collect(n);
        return true;
      }
      if (walk(n.children)) return true;
    }
    return false;
  };
  walk(tree);
  return out;
}

/** Camino raiz -> categoria (breadcrumb). */
export function categoryPath(tree, id) {
  const path = [];
  const walk = (nodes, trail) => {
    for (const n of nodes) {
      const next = [...trail, n];
      if (n.id === id) {
        path.push(...next);
        return true;
      }
      if (walk(n.children, next)) return true;
    }
    return false;
  };
  walk(tree, []);
  return path;
}
