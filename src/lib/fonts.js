import { Archivo, Fraunces, Karla, Libre_Baskerville, Petrona } from 'next/font/google';
import { DEFAULT_TYPESET } from '@/lib/theme';

/**
 * next/font necesita imports estaticos, asi que las combinaciones viven
 * en este registro. `tenant_settings.typeset` elige una por vivero.
 * Agregar una combinacion nueva es agregar una entrada aca.
 */

// Fraunces es la tipografia del manual de Paseo Corrientes (Fraunces 72pt).
// Los ejes opsz/SOFT/WONK se fijan en globals.css: opsz alto da el corte
// de display, con el contraste que se ve en el logo.
const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  axes: ['SOFT', 'WONK', 'opsz'],
  style: ['normal', 'italic'],
});

// Sustituto libre de Acumin Variable Concept, la sans del manual.
const archivo = Archivo({
  subsets: ['latin'],
  display: 'swap',
  axes: ['wdth'],
});

const petrona = Petrona({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
});

const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '700'],
  style: ['normal', 'italic'],
});

const karla = Karla({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600'],
});

export const TYPESETS = {
  'fraunces-archivo': {
    label: 'Fraunces + Archivo',
    display: fraunces,
    sans: archivo,
    caption: archivo,
  },
  'petrona-archivo': {
    label: 'Petrona + Archivo',
    display: petrona,
    sans: archivo,
    caption: archivo,
  },
  'baskerville-karla': {
    label: 'Libre Baskerville + Karla',
    display: libreBaskerville,
    sans: karla,
    caption: karla,
  },
};

export function getTypeset(name) {
  return TYPESETS[name] ?? TYPESETS[DEFAULT_TYPESET];
}

/** Variables CSS con las familias del typeset elegido. */
export function typesetVars(name) {
  const set = getTypeset(name);
  return {
    '--font-display': set.display.style.fontFamily,
    '--font-sans': set.sans.style.fontFamily,
    '--font-caption': set.caption.style.fontFamily,
  };
}
