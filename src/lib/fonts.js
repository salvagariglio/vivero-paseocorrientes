import {
  Archivo,
  Barlow,
  Barlow_Condensed,
  Karla,
  Libre_Baskerville,
  Petrona,
  Playfair_Display,
} from 'next/font/google';
import { DEFAULT_TYPESET } from '@/lib/theme';

/**
 * next/font necesita imports estaticos, asi que las combinaciones viven
 * en este registro. `tenant_settings.typeset` elige una por vivero.
 * Agregar una combinacion nueva es agregar una entrada aca.
 */

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '700'],
  style: ['normal', 'italic'],
});

const barlow = Barlow({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600'],
});

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  display: 'swap',
  weight: ['500', '600'],
});

const petrona = Petrona({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
});

const archivo = Archivo({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600'],
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
  // Serif de alto contraste + grotesca. Es la del manual de Paseo Corrientes.
  bosque: {
    label: 'Bosque — Playfair Display + Barlow',
    display: playfair,
    sans: barlow,
    caption: barlowCondensed,
  },
  // Serif variable argentina + grotesca argentina.
  herbario: {
    label: 'Herbario — Petrona + Archivo',
    display: petrona,
    sans: archivo,
    caption: archivo,
  },
  // Serif clasica de texto + grotesca humanista.
  mercado: {
    label: 'Mercado — Libre Baskerville + Karla',
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
