/**
 * Tokens de color por ROL. El vivero define cuantos colores quiere;
 * la app siempre pide roles, nunca "el verde" o "el segundo color".
 */

export const TYPESET_KEYS = ['fraunces-archivo', 'petrona-archivo', 'baskerville-karla'];
export const DEFAULT_TYPESET = 'fraunces-archivo';

export const THEME_TOKENS = [
  { key: 'surface', label: 'Papel', hint: 'Fondo general del sitio.' },
  { key: 'surface_alt', label: 'Bloques', hint: 'Fichas, filas alternas, franjas.' },
  { key: 'card', label: 'Superficie elevada', hint: 'Formularios y tarjetas del panel.' },
  { key: 'ink', label: 'Texto', hint: 'Titulos y texto principal.' },
  { key: 'ink_soft', label: 'Texto secundario', hint: 'Ayudas, metadatos, epigrafes.' },
  { key: 'on_dark', label: 'Texto sobre oscuro', hint: 'Se usa arriba de primary y secondary.' },
  { key: 'line', label: 'Lineas', hint: 'Bordes y divisores.' },
  { key: 'primary', label: 'Principal', hint: 'Botones, enlaces, marca.' },
  { key: 'primary_deep', label: 'Principal profundo', hint: 'Hover y fondos oscuros.' },
  { key: 'secondary', label: 'Carteleria', hint: 'Etiquetas y senaletica.' },
  { key: 'secondary_soft', label: 'Carteleria clara', hint: 'Variante suave del anterior.' },
  { key: 'earth', label: 'Tierra', hint: 'Datos y referencias.' },
  { key: 'accent', label: 'Detalle', hint: 'Promociones, sellos, acentos.' },
];

export const THEME_DEFAULTS = {
  surface: '#eef1e9',
  surface_alt: '#dfe4da',
  card: '#ffffff',
  ink: '#16241c',
  ink_soft: '#55655a',
  on_dark: '#f5f7f3',
  line: '#cfd8cb',
  primary: '#3f7064',
  primary_deep: '#2c4c47',
  secondary: '#2b5462',
  secondary_soft: '#387090',
  earth: '#7e6e5e',
  accent: '#c44f50',
};

const HEX = /^#[0-9a-f]{6}$/i;

/** Completa lo que falte y descarta valores que no sean hex. */
export function resolveTheme(theme) {
  const out = { ...THEME_DEFAULTS };
  for (const [key, value] of Object.entries(theme ?? {})) {
    if (key in THEME_DEFAULTS && typeof value === 'string' && HEX.test(value)) {
      out[key] = value.toLowerCase();
    }
  }
  return out;
}

/** Tokens -> variables CSS que consume globals.css. */
export function themeVars(theme) {
  const resolved = resolveTheme(theme);
  return Object.fromEntries(
    Object.entries(resolved).map(([key, value]) => [`--c-${key.replace(/_/g, '-')}`, value])
  );
}

/** Un token concreto, para cosas que se dibujan fuera de CSS (etiquetas, QR). */
export function token(theme, name, fallback = 'ink') {
  const resolved = resolveTheme(theme);
  return resolved[name] ?? resolved[fallback];
}
