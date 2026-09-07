import { slugify } from '@/lib/format';

/**
 * Actualizacion de precios desde la planilla del vivero.
 *
 * El mapeo de columnas NO es una constante: cada vivero manda su lista
 * con los encabezados que usa, y lo que elige queda guardado en
 * tenant_settings.price_import. Igual que theme o attribute_definitions,
 * la app trae un default razonable y la DB manda.
 *
 * Guardamos el ENCABEZADO, no el numero de columna: asi la planilla
 * puede venir con las columnas en otro orden y sigue funcionando.
 */

/** Lo unico que la app necesita entender de una planilla. */
export const IMPORT_FIELDS = [
  {
    key: 'sku',
    label: 'Código',
    hint: 'Con esto se engancha cada fila con su planta.',
    aliases: ['codigo', 'cod', 'sku', 'articulo', 'art'],
  },
  {
    key: 'price',
    label: 'Precio',
    hint: 'La única columna que se copia al catálogo.',
    aliases: ['precio publico', 'precio final', 'precio venta', 'precio', 'pvp'],
    required: true,
  },
  {
    key: 'name',
    label: 'Nombre',
    hint: 'Para las filas sin código y para leer la previsualización.',
    aliases: ['nombre vulgar', 'nombre', 'descripcion', 'detalle', 'producto'],
  },
  {
    key: 'scientific',
    label: 'Variedad / Especie',
    aliases: ['variedad especie', 'variedad', 'especie', 'nombre cientifico'],
  },
  {
    key: 'size',
    label: 'Tamaño',
    hint: 'El envase es parte del nombre de la planta.',
    aliases: ['tamano', 'envase', 'medida', 'maceta'],
  },
  {
    key: 'category',
    label: 'Categoría',
    aliases: ['categoria', 'rubro', 'familia'],
  },
];

/** Los centavos vienen de una formula de markup: cada vivero corta donde quiere. */
export const ROUNDINGS = [
  { value: 'peso', label: 'Al peso', hint: '10.847,39 → 10.847' },
  { value: 'centavo', label: 'Con centavos', hint: '10.847,39 → 10.847,39' },
  { value: 'decena', label: 'A la decena', hint: '10.847,39 → 10.850' },
  { value: 'centena', label: 'A la centena', hint: '10.847,39 → 10.800' },
];

export const DEFAULT_ROUNDING = 'peso';

/** Los cinco resultados posibles de una fila. */
export const OUTCOMES = [
  { key: 'sube', label: 'Suben' },
  { key: 'baja', label: 'Bajan' },
  { key: 'igual', label: 'Quedan igual' },
  { key: 'sin-precio', label: 'Sin precio en la planilla' },
  { key: 'alta', label: 'No están en el catálogo' },
];

const norm = (text) =>
  String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * Encabezado de la planilla -> campo de la app.
 * Primero respeta lo que el vivero ya eligio, despues adivina por alias.
 */
export function resolveColumns(headers = [], saved = {}) {
  const normalized = headers.map(norm);
  const taken = new Set();
  const columns = {};

  for (const field of IMPORT_FIELDS) {
    const chosen = saved?.[field.key];
    let index = chosen ? normalized.indexOf(norm(chosen)) : -1;

    if (index < 0) {
      index = normalized.findIndex((h, i) => !taken.has(i) && h && field.aliases.includes(h));
    }
    if (index < 0) {
      index = normalized.findIndex(
        (h, i) => !taken.has(i) && h && field.aliases.some((alias) => h.includes(alias))
      );
    }

    if (index >= 0) {
      taken.add(index);
      columns[field.key] = headers[index];
    }
  }

  return columns;
}

/**
 * "$ 10.847,39" -> 10847.39
 * Con dos separadores manda el ultimo. Con uno solo, tres digitos a la
 * derecha son miles: 1.500 son mil quinientos pesos, no uno con medio.
 */
export function parsePrice(raw) {
  if (raw === null || raw === undefined || raw === '' || typeof raw === 'boolean') return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;

  const clean = String(raw).replace(/[^\d.,-]/g, '').trim();
  if (!clean || clean === '-') return null;

  const comma = clean.lastIndexOf(',');
  const dot = clean.lastIndexOf('.');
  let text = clean;

  if (comma >= 0 && dot >= 0) {
    text = comma > dot ? clean.replace(/\./g, '').replace(',', '.') : clean.replace(/,/g, '');
  } else if (comma >= 0 || dot >= 0) {
    const parts = clean.split(comma >= 0 ? ',' : '.');
    const decimals = parts[parts.length - 1].length;
    text =
      parts.length > 2 || decimals === 3
        ? parts.join('')
        : `${parts.slice(0, -1).join('')}.${parts[parts.length - 1]}`;
  }

  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

export function roundPrice(value, rounding = DEFAULT_ROUNDING) {
  if (value === null || value === undefined) return null;
  switch (rounding) {
    case 'centavo':
      return Math.round(value * 100) / 100;
    case 'decena':
      return Math.round(value / 10) * 10;
    case 'centena':
      return Math.round(value / 100) * 100;
    default:
      return Math.round(value);
  }
}

const cell = (row, index) => (index < 0 ? '' : String(row[index] ?? '').trim());

/**
 * Fila cruda -> fila con los campos que entendemos.
 * Los slugs candidatos se arman con el mismo criterio que uso la
 * importacion original, por eso enganchan con los slugs que ya existen
 * (aromito-e15) sin regenerar ninguno.
 */
export function normalizeRow(row, line, headers, columns, rounding) {
  const at = (key) => (columns[key] ? headers.indexOf(columns[key]) : -1);

  const especie = cell(row, at('scientific'));
  const vulgar = cell(row, at('name'));
  const size = cell(row, at('size'));

  const paren = especie.match(/\(([^)]+)\)/);
  const scientific = especie.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
  const name = vulgar || (paren ? paren[1].trim() : scientific);

  const priceIndex = at('price');
  const price = roundPrice(parsePrice(priceIndex < 0 ? null : row[priceIndex]), rounding);
  const category = cell(row, at('category'));

  return {
    line,
    sku: cell(row, at('sku')) || null,
    name: name || null,
    scientific: scientific && slugify(scientific) !== slugify(name) ? scientific : null,
    size: size || null,
    categorySlug: category ? slugify(category) : null,
    price: price !== null && price > 0 ? price : null,
    slugs: name ? [size ? slugify(`${name} ${size}`) : null, slugify(name)].filter(Boolean) : [],
  };
}

const isBlank = (row) =>
  row.every((value) => value === null || value === undefined || String(value).trim() === '');

/**
 * Compara la planilla contra el catalogo. No decide nada: arma el
 * detalle para que la persona mire antes de aplicar.
 */
export function buildPriceDiff({
  rows = [],
  products = [],
  columns = {},
  rounding = DEFAULT_ROUNDING,
}) {
  const headers = (rows[0] ?? []).map((value) => String(value ?? ''));

  const bySku = new Map();
  const bySlug = new Map();
  for (const product of products) {
    if (product.sku) bySku.set(norm(product.sku), product);
    bySlug.set(String(product.slug), product);
  }

  const takenSlugs = new Set(bySlug.keys());
  const matched = new Set();
  const items = [];

  rows.slice(1).forEach((row, index) => {
    if (!Array.isArray(row) || isBlank(row)) return;

    // +2: la fila 1 es el encabezado y las planillas cuentan desde 1.
    const parsed = normalizeRow(row, index + 2, headers, columns, rounding);

    let product = parsed.sku ? bySku.get(norm(parsed.sku)) : null;
    let via = product ? 'código' : null;

    // Sin codigo (o con un codigo que no esta en el catalogo) probamos por
    // nombre, pero nunca contra una planta que ya tiene OTRO codigo: ahi
    // manda el codigo y la fila queda como alta.
    //
    // Dos filas pueden llamarse igual (dos macetas Batea 50). El catalogo
    // las guardo como slug y slug-2, asi que seguimos esa misma cadena
    // hasta encontrar una que ninguna fila anterior haya tomado.
    if (!product) {
      for (const base of parsed.slugs) {
        let slug = base;
        let n = 1;
        while (bySlug.has(slug)) {
          const candidate = bySlug.get(slug);
          if (!matched.has(candidate.id) && (!parsed.sku || !candidate.sku)) {
            product = candidate;
            via = 'nombre';
            break;
          }
          slug = `${base}-${++n}`;
        }
        if (product) break;
      }
    }

    let outcome;
    let oldPrice = null;
    let slug = null;

    if (product) {
      matched.add(product.id);
      slug = product.slug;
      oldPrice = product.price === null || product.price === undefined ? null : Number(product.price);

      if (parsed.price === null) outcome = 'sin-precio';
      else if (oldPrice === null || parsed.price > oldPrice) outcome = 'sube';
      else if (parsed.price < oldPrice) outcome = 'baja';
      else outcome = 'igual';
    } else {
      outcome = 'alta';
      // Slug propio para el alta, con el mismo sufijo que ya usa el catalogo.
      const base = parsed.slugs[0] || slugify(parsed.sku || '');
      let candidate = base;
      let n = 1;
      while (candidate && takenSlugs.has(candidate)) candidate = `${base}-${++n}`;
      if (candidate) takenSlugs.add(candidate);
      slug = candidate || null;
    }

    items.push({
      line: parsed.line,
      productId: product?.id ?? null,
      sku: parsed.sku,
      slug,
      name: parsed.name,
      scientific: parsed.scientific,
      size: parsed.size,
      // La referencia de envase guarda la opcion por clave, no por etiqueta.
      envase: parsed.size ? slugify(parsed.size) : null,
      categorySlug: parsed.categorySlug,
      price: parsed.price,
      oldPrice,
      outcome,
      via,
    });
  });

  const counts = Object.fromEntries(OUTCOMES.map(({ key }) => [key, 0]));
  for (const item of items) counts[item.outcome] += 1;

  // Dos filas que caen en la misma planta: una le pisa el precio a la
  // otra. Casi siempre es un codigo repetido en la planilla.
  const lines = new Map();
  for (const item of items) {
    if (!item.productId) continue;
    lines.set(item.productId, [...(lines.get(item.productId) ?? []), item]);
  }
  const duplicates = [...lines.values()].filter((group) => group.length > 1);

  // Plantas del catalogo que la planilla no nombra. No se tocan: se
  // muestran porque suelen ser las que el vivero dejo de traer.
  const absent = products.filter((product) => !matched.has(product.id));

  return { headers, items, counts, absent, duplicates, total: items.length };
}

/** Las filas que van a cambiar un precio. Una alta sin nombre no se puede crear. */
export const willChange = (items = []) =>
  items.filter((item) => item.productId && (item.outcome === 'sube' || item.outcome === 'baja'));

export const willCreate = (items = []) =>
  items.filter((item) => item.outcome === 'alta' && item.name && item.slug);
