import fs from 'node:fs';
import xlsx from 'xlsx';

const FILE = process.argv[2];
const OUT = process.argv[3] ?? 'import.sql';
const SLUG = 'paseo-corrientes';

const slugify = (t) =>
  String(t || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

const q = (v) => (v === null || v === undefined || v === '' ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
const n = (v) => (v === null || v === undefined || Number.isNaN(v) ? 'null' : String(v));

// Agrupacion propuesta: 6 familias sobre las 23 categorias del listado.
// Editable desde el panel; la fuente sigue siendo la columna Categoria.
const GROUPS = [
  ['Árboles', [
    ['ARBOLES - VEREDA - CORTINAS', 'Árboles de vereda y cortinas'],
    ['ARBOLES ORNAMENTALES UNICOS', 'Árboles ornamentales'],
    ['ARBOLES NATIVOS', 'Árboles nativos'],
    ['CONIFERAS', 'Coníferas'],
    ['PLAMERAS', 'Palmeras'],
  ]],
  ['Frutales y cítricos', [
    ['FRUTALES', 'Frutales'],
    ['CITRICOS', 'Cítricos'],
  ]],
  ['Arbustivas', [
    ['ARBUSTIVAS / ESTRUCTURAS', 'Arbustivas y estructuras'],
    ['ARBUSTIVAS CON FLOR', 'Arbustivas con flor'],
    ['CERCOS VIVOS', 'Cercos vivos'],
    ['ROSAS', 'Rosas'],
  ]],
  ['Herbáceas y cubresuelos', [
    ['HERBACEAS', 'Herbáceas'],
    ['GRAMINEAS', 'Gramíneas'],
    ['RASTRERAS (cubresuelos / tapizantes)', 'Rastreras y cubresuelos'],
    ['TREPADORAS', 'Trepadoras'],
    ['FLORES Y PLANTINES DE ESTACION', 'Flores y plantines de estación'],
    ['AROMATICAS', 'Aromáticas'],
  ]],
  ['Interior y tropicales', [
    ['TROPICALES', 'Tropicales'],
    ['PLANTAS DE INTERIOR', 'Plantas de interior'],
    ['AGAVES Y CACTUS', 'Agaves y cactus'],
  ]],
  ['Vivero', [
    ['ACCESORIOS / MACETAS', 'Accesorios y macetas'],
    ['SUSTRATOS / TERRAFERTIL', 'Sustratos'],
    ['SUSTRATOS', 'Sustratos'],
  ]],
];

for (const [parent, children] of GROUPS) {
  const ps = slugify(parent);
  if (children.some(([, name]) => slugify(name) === ps)) {
    throw new Error();
  }
}

const catMap = new Map(); // origen -> { parent, name, slug }
for (const [parent, children] of GROUPS) {
  for (const [source, name] of children) {
    catMap.set(source, { parent, name, slug: slugify(name) });
  }
}

const wb = xlsx.readFile(FILE);
const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });

const sizes = new Set();
const seen = new Map();
const products = [];
const unmapped = new Set();

rows.forEach((row, index) => {
  const source = String(row['Categoría'] || '').trim();
  const cat = catMap.get(source);
  if (!cat) unmapped.add(source);

  const especie = String(row['Variedad / Especie'] || '').trim();
  const vulgar = String(row['Nombre vulgar'] || '').trim();
  const size = String(row['Tamaño'] || '').trim();
  const sku = String(row['Código'] || '').trim();
  const rawPrice = Number(row['PRECIO PUBLICO']) || 0;

  // "Populus nigra var. italica (Alamo piramidal)" -> cientifico + vulgar
  const paren = especie.match(/\(([^)]+)\)/);
  const scientific = especie.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
  const name = vulgar || (paren ? paren[1].trim() : scientific);
  if (!name) return;

  if (size) sizes.add(size);

  let base = slugify(size ? `${name} ${size}` : name);
  if (!base) base = slugify(sku || `planta-${index}`);
  const count = (seen.get(base) ?? 0) + 1;
  seen.set(base, count);
  const slug = count === 1 ? base : `${base}-${count}`;

  products.push({
    slug,
    name,
    scientific: scientific && slugify(scientific) !== slugify(name) ? scientific : null,
    sku: sku || null,
    // El listado trae centavos de una formula de markup; se redondea a peso.
    price: rawPrice > 0 ? Math.round(rawPrice) : null,
    categorySlug: cat?.slug ?? null,
    attributes: size ? { envase: size } : {},
    position: index,
  });
});

const sizeOptions = [...sizes].sort((a, b) => {
  const na = Number(a.replace(/\D/g, '')) || 0;
  const nb = Number(b.replace(/\D/g, '')) || 0;
  return a[0] === b[0] ? na - nb : a.localeCompare(b);
});

/* ------------------------------------------------------------------ */

const lines = [];
lines.push(`-- Importado de "${FILE.split(/[\\/]/).pop()}" — ${products.length} productos`);
lines.push(`do $imp$
declare v_tenant uuid; v_parent uuid;
begin
  select id into v_tenant from public.tenants where slug = '${SLUG}';
  if v_tenant is null then raise exception 'falta el tenant ${SLUG}'; end if;
`);

let pos = 0;
for (const [parent, children] of GROUPS) {
  pos += 10;
  const parentSlug = slugify(parent);
  lines.push(`  insert into public.categories (tenant_id, name, slug, position)
  values (v_tenant, ${q(parent)}, ${q(parentSlug)}, ${pos})
  on conflict (tenant_id, slug) do update set name = excluded.name
  returning id into v_parent;`);

  let childPos = 0;
  const done = new Set();
  for (const [, name] of children) {
    const s = slugify(name);
    if (done.has(s)) continue;
    done.add(s);
    childPos += 10;
    lines.push(`  insert into public.categories (tenant_id, parent_id, name, slug, position)
  values (v_tenant, v_parent, ${q(name)}, ${q(s)}, ${childPos})
  on conflict (tenant_id, slug) do update set name = excluded.name, parent_id = excluded.parent_id;`);
  }
  lines.push('');
}

// Referencia de envase, con los valores reales del listado
const envaseOptions = sizeOptions.map((s) => ({ value: slugify(s), label: s, icon: 'circulo' }));
lines.push(`  insert into public.attribute_definitions
    (tenant_id, key, label, kind, options, position, show_on_label, show_on_card)
  values (v_tenant, 'envase', 'Envase', 'single',
    ${q(JSON.stringify(envaseOptions))}::jsonb, 7, true, false)
  on conflict (tenant_id, key) do update set options = excluded.options;
`);

for (const p of products) {
  const attrs = p.attributes.envase
    ? { envase: slugify(p.attributes.envase) }
    : {};
  lines.push(`  insert into public.products
    (tenant_id, category_id, name, slug, scientific_name, sku, price, attributes, position, is_active)
  values (v_tenant,
    ${p.categorySlug ? `(select id from public.categories where tenant_id = v_tenant and slug = ${q(p.categorySlug)})` : 'null'},
    ${q(p.name)}, ${q(p.slug)}, ${q(p.scientific)}, ${q(p.sku)}, ${n(p.price)},
    ${q(JSON.stringify(attrs))}::jsonb, ${p.position}, true)
  on conflict (tenant_id, slug) do update set
    name = excluded.name, scientific_name = excluded.scientific_name,
    sku = excluded.sku, price = excluded.price,
    category_id = excluded.category_id, attributes = excluded.attributes;`);
}

lines.push(`end $imp$;`);

fs.writeFileSync(OUT, lines.join('\n'));

console.log(`productos: ${products.length}`);
console.log(`con precio: ${products.filter((p) => p.price).length}`);
console.log(`envases: ${sizeOptions.join(' ')}`);
if (unmapped.size) console.log(`SIN MAPEAR: ${[...unmapped].join(' | ')}`);
console.log(`sql: ${OUT} (${(fs.statSync(OUT).size / 1024).toFixed(0)} KB)`);
