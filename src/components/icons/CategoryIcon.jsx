/**
 * Dibujos de categoria, en el vocabulario de "trazos y motivos" del manual:
 * una sola linea, sin relleno, punta redondeada.
 *
 * La clave la elige cada vivero en categories.icon (solo las familias
 * llevan dibujo). Si no existe, cae en la hoja generica: nunca rompe.
 */

const ICONS = {
  // --- arboles ---------------------------------------------------------
  arbol: (
    <>
      <path d="M15.5 25c-5 0-8-4-6.5-8.5C5.5 13 8 7.5 13 7.5c1.5-3.5 7-5 10-2 3.5-3 9-1 10 3 5 .5 7 6 4 9.5 2 4.5-1 8.5-6 9" />
      <path d="M15.5 25h17" />
      <path d="M24 25v18" />
      <path d="M24 33l-6.5-5M24 38l6.5-5" />
      <path d="M18 43h12" />
    </>
  ),

  conifera: (
    <>
      <path d="M24 5v38" />
      <path d="M24 10l-7 7.5M24 10l7 7.5" />
      <path d="M24 17l-10.5 10M24 17l10.5 10" />
      <path d="M24 25L10 36M24 25l14 11" />
      <path d="M18 43h12" />
    </>
  ),

  palmera: (
    <>
      <path d="M23 15c1 9 .5 19-2 28" />
      <path d="M23 15c-5-4.5-11-4.5-15.5.5 5.5-1 9.5.5 12.5 4" />
      <path d="M23 15c5-4.5 11-4.5 15.5.5-5.5-1-9.5.5-12.5 4" />
      <path d="M23 15c-2-6-6.5-9-13-9 4.5 2.5 7.5 5.5 9 9.5" />
      <path d="M23 15c2-6 6.5-9 13-9-4.5 2.5-7.5 5.5-9 9.5" />
      <path d="M16 43h13" />
    </>
  ),

  // --- frutales --------------------------------------------------------
  frutal: (
    <>
      <path d="M9 6c9 5.5 15.5 15.5 17 37" />
      <path d="M16 16c-4-2.5-8-2-11 1.5 3.5 2.5 7.5 2 11-1.5Z" />
      <path d="M21 27c3-4.5 7-5.5 11-3-2.5 4-6.5 5-11 3Z" />
      <circle cx="31" cy="13" r="4.5" />
      <circle cx="38" cy="22.5" r="4.5" />
      <path d="M31 8.5c0-2 1-3.5 2.5-4M38 18c0-2 1-3.5 2.5-4" />
    </>
  ),

  citrico: (
    <>
      <circle cx="22" cy="28" r="13.5" />
      <path d="M22 14.5v27M8.5 28h27" />
      <path d="M12.5 18.5 31.5 37.5M31.5 18.5 12.5 37.5" />
      <path d="M22 14.5c2-5.5 6.5-8.5 13-8.5-1 5.5-4.5 8.5-9 9.5" />
    </>
  ),

  // --- arbustivas ------------------------------------------------------
  arbustiva: (
    <>
      <path d="M8 37c-1.5-11 5-20 16-20s17.5 9 16 20" />
      <path d="M24 37V19" />
      <path d="M24 29l-7-6M24 32l7-6" />
      <path d="M17 23c-3-1.5-4.5-4-4.5-7 3 .5 5 2.5 4.5 7ZM31 26c3-1.5 4.5-4 4.5-7-3 .5-5 2.5-4.5 7Z" />
      <path d="M8 42h32" />
    </>
  ),

  cerco: (
    <>
      <path d="M9 21c4-6.5 10-9.5 15-9.5S35 14.5 39 21" />
      <path d="M9 21h30v17H9z" />
      <path d="M16 21v17M24 21v17M32 21v17" />
      <path d="M6 42h36" />
    </>
  ),

  rosa: (
    <>
      <path d="M24 7c-4.5 0-8 3.5-8 7.5S19.5 22 24 22s8-3.5 8-7.5S28.5 7 24 7Z" />
      <path d="M24 11.5c-1.8 0-3.2 1.4-3.2 3s1.4 3 3.2 3" />
      <path d="M24 22v21" />
      <path d="M24 31c-5 0-8.5-3-9-7 5-.5 8.5 2 9 7Z" />
      <path d="M24 38c5 0 8.5-3 9-7-5-.5-8.5 2-9 7Z" />
      <path d="M20 26.5l-2-2M28 33.5l2-2" />
    </>
  ),

  // --- herbaceas y cubresuelos ----------------------------------------
  herbacea: (
    <>
      <path d="M24 43c-2.5-11-7.5-19-15-24" />
      <path d="M24 43c1-13 .5-22-2-27" />
      <path d="M24 43c2.5-11 7.5-19 15-24" />
      <path d="M24 43c-.5-12 1.5-20 6-25" />
      <path d="M18 43h12" />
    </>
  ),

  graminea: (
    <>
      <path d="M17 43c-2-11 0-19 4.5-24" />
      <path d="M24 43c0-13 2-21 6.5-26" />
      <path d="M31 43c2-9 5.5-15 9.5-18" />
      <path d="M21.5 19c-2-3.5-1.5-7 1-9.5 2 3 2 6.5 0 9.5" />
      <path d="M30.5 17c-2-3.5-1.5-7 1-9.5 2 3 2 6.5 0 9.5" />
      <path d="M12 43h24" />
    </>
  ),

  rastrera: (
    <>
      <path d="M5 33c6.5-4.5 13-4.5 19 0s12.5 4.5 19 0" />
      <path d="M12 32.5c-.5-4 1.5-6.8 5-7.5 0 4-1.5 6.5-5 7.5Z" />
      <path d="M23.5 29c-.5-4 1.5-6.8 5-7.5 0 4-1.5 6.5-5 7.5Z" />
      <path d="M35 32c-.5-4 1.5-6.8 5-7.5 0 4-1.5 6.5-5 7.5Z" />
      <path d="M5 41h38" />
    </>
  ),

  trepadora: (
    <>
      <path d="M15 43V6" />
      <path d="M15 36c6.5.5 10.5-2.5 11-8M15 25c6.5.5 10.5-2.5 11-8M15 14c6.5.5 10.5-2.5 11-8" />
      <path d="M26 28c5-.5 8-3.5 8-8.5M26 17c5-.5 8-3.5 8-8.5" />
      <path d="M34 19.5c4 0 6.5-2.5 7-6.5" />
      <path d="M10 43h12" />
    </>
  ),

  flor: (
    <>
      {[0, 72, 144, 216, 288].map((deg) => (
        <path
          key={deg}
          d="M24 20c-4-2-6-6-4.5-9.5C23 8 26.5 10 27 14"
          transform={`rotate(${deg} 24 20)`}
        />
      ))}
      <circle cx="24" cy="20" r="3.4" />
      <path d="M24 24v19" />
      <path d="M24 34c-4.5 0-7.5-2.5-8-6.5 4.5 0 7.5 2.5 8 6.5Z" />
      <path d="M24 39c4.5 0 7.5-2.5 8-6.5-4.5 0-7.5 2.5-8 6.5Z" />
    </>
  ),

  aromatica: (
    <>
      <path d="M24 43V8" />
      <path d="M24 15c-4.5-1-7-4-7-8 4.5.5 7 3.5 7 8ZM24 15c4.5-1 7-4 7-8-4.5.5-7 3.5-7 8Z" />
      <path d="M24 25c-4.5-1-7-4-7-8 4.5.5 7 3.5 7 8ZM24 25c4.5-1 7-4 7-8-4.5.5-7 3.5-7 8Z" />
      <path d="M24 35c-4.5-1-7-4-7-8 4.5.5 7 3.5 7 8ZM24 35c4.5-1 7-4 7-8-4.5.5-7 3.5-7 8Z" />
    </>
  ),

  // --- interior y tropicales ------------------------------------------
  tropical: (
    <>
      <path d="M24 43V21" />
      <path d="M24 21C11 21 4.5 14 5 4c11 .5 19 7.5 19 17Z" />
      <path d="M24 21c13 0 19.5-7 19-17-11 .5-19 7.5-19 17Z" />
      <path d="M13 7.5 18 13M8 13.5l6 4.5M35 7.5 30 13M40 13.5l-6 4.5" />
      <path d="M18 43h12" />
    </>
  ),

  interior: (
    <>
      <path d="M14 28h20l-2.5 15h-15L14 28Z" />
      <path d="M11 23h26v5H11z" />
      <path d="M24 23V10" />
      <path d="M24 19c-5.5 0-9-3.5-9-9 5.5 0 9 3.5 9 9ZM24 21c5.5 0 9-3.5 9-9-5.5 0-9 3.5-9 9Z" />
    </>
  ),

  cactus: (
    <>
      <path d="M19.5 41V13.5a4.5 4.5 0 0 1 9 0V41" />
      <path d="M19.5 27H16a4.5 4.5 0 0 1-4.5-4.5v-5" />
      <path d="M28.5 33H32a4.5 4.5 0 0 0 4.5-4.5v-7" />
      <path d="M14 41h20" />
      <path d="M24 17v5M24 26v5M24 35v3" />
    </>
  ),

  // --- insumos ---------------------------------------------------------
  maceta: (
    <>
      <path d="M10.5 17h27l-3.5 24h-20l-3.5-24Z" />
      <path d="M7.5 10h33v7h-33z" />
      <path d="M14 27h20" />
    </>
  ),

  sustrato: (
    <>
      <path d="M12.5 17h23l3 25h-29l3-25Z" />
      <path d="M18 17c0-4.5 2.5-7 6-7s6 2.5 6 7" />
      <path d="M16 28c2.5-2 5-2 7.5 0s5 2 7.5 0" />
      <path d="M16 35c2.5-2 5-2 7.5 0s5 2 7.5 0" />
    </>
  ),

  hoja: (
    <>
      <path d="M24 8c7 7 7 21 0 28-7-7-7-21 0-28Z" />
      <path d="M24 11v32" />
      <path d="M24 18l-5.5 3.5M24 18l5.5 3.5M24 25l-6 4M24 25l6 4" />
    </>
  ),
};

export const CATEGORY_ICON_KEYS = Object.keys(ICONS);

export default function CategoryIcon({ name, size = 48, className = '', title }) {
  const draw = ICONS[name] ?? ICONS.hoja;

  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={className}
    >
      {title && <title>{title}</title>}
      {draw}
    </svg>
  );
}
