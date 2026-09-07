/**
 * Lector minimo de .xlsx.
 *
 * Un xlsx es un zip con XML adentro: alcanza con inflate y dos regex.
 * No metemos una dependencia de planillas a proposito — el repo es
 * publico y las libs del rubro arrastran advisories que no queremos
 * heredar por leer una lista de precios.
 *
 * Solo lee la primera hoja y devuelve la matriz de valores.
 * Corre unicamente en el server (usa node:zlib).
 */
import { inflateRawSync } from 'node:zlib';

const SIG_EOCD = 0x06054b50;
const SIG_CENTRAL = 0x02014b50;

function findEocd(buf) {
  const min = Math.max(0, buf.length - 22 - 0xffff);
  for (let i = buf.length - 22; i >= min; i--) {
    if (buf.readUInt32LE(i) === SIG_EOCD) return i;
  }
  return -1;
}

/** nombre -> contenido descomprimido de cada entrada del zip. */
function unzip(buf) {
  const eocd = findEocd(buf);
  if (eocd < 0) throw new Error('El archivo no parece un .xlsx.');

  const total = buf.readUInt16LE(eocd + 10);
  let offset = buf.readUInt32LE(eocd + 16);
  const files = new Map();

  for (let i = 0; i < total; i++) {
    if (offset + 46 > buf.length || buf.readUInt32LE(offset) !== SIG_CENTRAL) break;

    const method = buf.readUInt16LE(offset + 10);
    const compressed = buf.readUInt32LE(offset + 20);
    const nameLen = buf.readUInt16LE(offset + 28);
    const extraLen = buf.readUInt16LE(offset + 30);
    const commentLen = buf.readUInt16LE(offset + 32);
    const local = buf.readUInt32LE(offset + 42);
    const name = buf.toString('utf8', offset + 46, offset + 46 + nameLen);

    if (compressed === 0xffffffff || local === 0xffffffff) {
      throw new Error('El .xlsx esta en formato zip64. Volvé a guardarlo desde Excel.');
    }

    // El header local repite el nombre y trae su propio campo extra.
    const data = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const raw = buf.subarray(data, data + compressed);
    files.set(name, method === 0 ? raw : inflateRawSync(raw));

    offset += 46 + nameLen + extraLen + commentLen;
  }

  return files;
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function decode(xml) {
  return String(xml).replace(/&(#x[0-9a-fA-F]+|#[0-9]+|amp|lt|gt|quot|apos);/g, (match, entity) => {
    if (entity[0] !== '#') return ENTITIES[entity] ?? match;
    const hex = entity[1] === 'x' || entity[1] === 'X';
    const code = parseInt(hex ? entity.slice(2) : entity.slice(1), hex ? 16 : 10);
    return Number.isFinite(code) ? String.fromCodePoint(code) : match;
  });
}

/** Un texto con formato viene partido en varios <t>: se concatenan. */
function textOf(fragment) {
  let out = '';
  const re = /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g;
  let match;
  while ((match = re.exec(fragment))) out += decode(match[1]);
  return out;
}

function sharedStrings(files) {
  const file = files.get('xl/sharedStrings.xml');
  if (!file) return [];

  const xml = file.toString('utf8');
  const out = [];
  const re = /<si(?:\s[^>]*)?>([\s\S]*?)<\/si>|<si(?:\s[^>]*)?\/>/g;
  let match;
  while ((match = re.exec(xml))) out.push(textOf(match[1] ?? ''));
  return out;
}

/** La hoja que Excel muestra primero, no la que el zip guarda primero. */
function firstSheetPath(files) {
  const workbook = files.get('xl/workbook.xml')?.toString('utf8') ?? '';
  const rels = files.get('xl/_rels/workbook.xml.rels')?.toString('utf8') ?? '';

  const id = workbook.match(/<sheet\b[^>]*\/?>/)?.[0].match(/r:id="([A-Za-z0-9]+)"/)?.[1];
  if (id) {
    const rel = rels.match(new RegExp(`<Relationship[^>]*Id="${id}"[^>]*>`))?.[0];
    const target = rel?.match(/Target="([^"]+)"/)?.[1];
    if (target) {
      const path = target.startsWith('/')
        ? target.slice(1)
        : `xl/${target.replace(/^\.\//, '')}`;
      if (files.has(path)) return path;
    }
  }

  for (const name of files.keys()) {
    if (/^xl\/worksheets\/[^/]+\.xml$/.test(name)) return name;
  }
  throw new Error('El .xlsx no tiene ninguna hoja.');
}

/** "AB12" -> 27 */
function columnIndex(ref) {
  let n = 0;
  for (const char of ref) {
    const code = char.charCodeAt(0);
    if (code < 65 || code > 90) break;
    n = n * 26 + (code - 64);
  }
  return n - 1;
}

/**
 * Devuelve la primera hoja como matriz. Respeta la posicion de cada
 * celda: una columna vacia queda vacia, no corre a las de al lado.
 */
export function readSheet(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  const files = unzip(buf);
  const strings = sharedStrings(files);
  const xml = files.get(firstSheetPath(files)).toString('utf8');

  const rows = [];
  const rowRe = /<row\b([^>]*)>([\s\S]*?)<\/row>/g;
  const cellRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;

  let row;
  while ((row = rowRe.exec(xml))) {
    const cells = [];
    cellRe.lastIndex = 0;

    let cell;
    while ((cell = cellRe.exec(row[2]))) {
      const attrs = cell[1] ?? '';
      const body = cell[2] ?? '';
      const type = attrs.match(/t="([^"]+)"/)?.[1] ?? 'n';
      const at = columnIndex(attrs.match(/r="([A-Z]+)/)?.[1] ?? '');
      const raw = body.match(/<v>([\s\S]*?)<\/v>/)?.[1];

      let value = null;
      if (type === 's') {
        value = strings[Number(raw)] ?? '';
      } else if (type === 'inlineStr') {
        value = textOf(body);
      } else if (raw == null) {
        value = null;
      } else if (type === 'str' || type === 'e') {
        value = decode(raw);
      } else if (type === 'b') {
        value = raw === '1';
      } else {
        const n = Number(raw);
        value = Number.isFinite(n) ? n : decode(raw);
      }

      if (at >= 0) cells[at] = value;
      else cells.push(value);
    }

    // Respetamos el numero de fila de la planilla: una fila vacia no se
    // guarda en el XML y no queremos correr la numeracion, porque despues
    // la previsualizacion dice "fila 47" y esa tiene que ser la 47 de Excel.
    const at = Number(row[1].match(/\br="(\d+)"/)?.[1]);
    if (Number.isInteger(at) && at > 0) rows[at - 1] = cells;
    else rows.push(cells);
  }

  return rows;
}
