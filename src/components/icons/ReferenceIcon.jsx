/**
 * Iconos de referencia, en la gramatica de la carteleria de Paseo Corrientes:
 * siempre hay un circulo en el centro y el modificador crece alrededor.
 *
 * Las claves las elige cada vivero en attribute_definitions.options[].icon.
 * Si una clave no existe aca, se dibuja el circulo base: nunca rompe.
 */

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' };

function Circle({ r = 3.6 }) {
  return <circle cx="12" cy="12" r={r} {...S} />;
}

function rays(count, inner, outer, dash) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(angle);
    const y = Math.sin(angle);
    return (
      <line
        key={i}
        x1={12 + x * inner}
        y1={12 + y * inner}
        x2={12 + x * outer}
        y2={12 + y * outer}
        {...S}
        strokeDasharray={dash}
      />
    );
  });
}

function Drop({ level }) {
  const d = 'M12 3.4c3.2 3.6 5 6.2 5 8.6a5 5 0 0 1-10 0c0-2.4 1.8-5 5-8.6Z';
  return (
    <>
      <path d={d} fill="currentColor" fillOpacity={[0, 0.22, 0.5, 1][level] ?? 0} />
      <path d={d} {...S} />
      <circle cx="12" cy="12.4" r="2.1" fill="var(--c-surface, #fff)" stroke="none" />
    </>
  );
}

function Snowflake({ arms }) {
  return (
    <>
      {arms > 0 && rays(arms, 5.2, 9.6)}
      {arms > 3 &&
        rays(arms, 7.4, 9.2).map((el, i) => (
          <g key={`b${i}`} transform={`rotate(${(360 / arms) * i + 20} 12 12)`} opacity="0.9">
            <line x1="12" y1="4.4" x2="13.6" y2="6" {...S} />
            <line x1="12" y1="4.4" x2="10.4" y2="6" {...S} />
          </g>
        ))}
      <Circle />
    </>
  );
}

const ICONS = {
  circulo: () => <Circle />,

  'gota-1': () => <Drop level={1} />,
  'gota-2': () => <Drop level={2} />,
  'gota-3': () => <Drop level={3} />,

  // Interior = techo doble; galeria = techo simple; exterior = sin techo.
  'arco-doble': () => (
    <>
      <path d="M3.6 19V12a8.4 8.4 0 0 1 16.8 0v7" {...S} />
      <path d="M7.4 19v-6.6a4.6 4.6 0 0 1 9.2 0V19" {...S} />
      <Circle r="3.1" />
    </>
  ),
  'arco-simple': () => (
    <>
      <path d="M5 19v-6.8a7 7 0 0 1 14 0V19" {...S} />
      <Circle r="3.3" />
    </>
  ),

  'sol-0': () => <Circle />,
  'sol-1': () => (
    <>
      {rays(5, 6, 8.6, '0.1 2.6')}
      <Circle />
    </>
  ),
  'sol-2': () => (
    <>
      {rays(8, 6.2, 9.6)}
      <Circle r="4" />
    </>
  ),

  'copo-0': () => <Circle />,
  'copo-1': () => <Snowflake arms={3} />,
  'copo-2': () => <Snowflake arms={6} />,

  'hoja-perenne': () => (
    <>
      <path d="M12 13c-3.4 0-6-1.6-7.4-4.4C7.4 7.2 10.6 8 12 11.4 13.4 8 16.6 7.2 19.4 8.6 18 11.4 15.4 13 12 13Z" fill="currentColor" stroke="none" />
      <path d="M12 13v5.6" {...S} />
      <circle cx="12" cy="12.6" r="2.2" fill="var(--c-surface, #fff)" stroke="none" />
    </>
  ),

  'hoja-otono': () => (
    <>
      <path d="M14.6 6.8c2.8 1 3.6 3.8 2.2 6.4-2.6 1.2-5.2 0-6-2.8" fill="currentColor" stroke="none" opacity="0.85" />
      <path d="M9.2 13.4 6 18.6" {...S} strokeDasharray="2.4 2.4" />
      <Circle r="2.6" />
    </>
  ),

  flor: () => (
    <>
      {Array.from({ length: 6 }, (_, i) => (
        <ellipse
          key={i}
          cx="12"
          cy="6.6"
          rx="2.4"
          ry="3.4"
          {...S}
          transform={`rotate(${i * 60} 12 12)`}
        />
      ))}
      <Circle r="2.4" />
    </>
  ),
};

export default function ReferenceIcon({ name, size = 28, className = '', title }) {
  const Draw = ICONS[name] ?? ICONS.circulo;

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={className}
    >
      {title && <title>{title}</title>}
      {Draw()}
    </svg>
  );
}

export const ICON_KEYS = Object.keys(ICONS);
