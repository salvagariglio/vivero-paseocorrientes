import ReferenceIcon from '@/components/icons/ReferenceIcon';

/**
 * Replica el cartel de referencias del local: se muestra la escala completa
 * y se marca la opcion que corresponde. El cliente ve lo mismo en la planta
 * y en el telefono.
 */

function selectedValues(definition, value) {
  if (value === null || value === undefined) return [];
  return Array.isArray(value) ? value.map(String) : [String(value)];
}

function Scale({ definition, value }) {
  const chosen = selectedValues(definition, value);
  const options = Array.isArray(definition.options) ? definition.options : [];
  if (options.length === 0) return null;

  return (
    <div className="border border-line bg-surface-alt px-4 py-4">
      <p className="font-display text-lg leading-none text-ink">{definition.label}</p>
      <div className="mt-2 h-px bg-line" />

      <ul className="mt-4 flex items-end justify-between gap-2">
        {options.map((option) => {
          const active = chosen.includes(String(option.value));
          return (
            <li key={option.value} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <ReferenceIcon
                name={option.icon}
                size={30}
                title={option.label}
                className={active ? 'text-primary' : 'text-ink-soft/35'}
              />
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  active ? 'bg-primary' : 'bg-line'
                }`}
                aria-hidden
              />
              <span
                className={`caption text-center text-[0.65rem] leading-tight ${
                  active ? 'text-ink' : 'text-ink-soft/60'
                }`}
              >
                {option.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FreeText({ definition, value }) {
  return (
    <div className="border border-line bg-surface-alt px-4 py-4">
      <p className="font-display text-lg leading-none text-ink">{definition.label}</p>
      <div className="mt-2 h-px bg-line" />
      <p className="mt-3 text-sm leading-relaxed text-ink">{String(value)}</p>
    </div>
  );
}

export default function AttributeReferences({ definitions = [], attributes = {}, title = 'Referencias' }) {
  const rows = definitions
    .map((definition) => ({ definition, value: attributes?.[definition.key] }))
    .filter(({ value }) =>
      Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && value !== ''
    );

  if (rows.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="caption text-xs uppercase tracking-[0.14em] text-ink-soft">{title}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {rows.map(({ definition, value }) =>
          definition.kind === 'text' ? (
            <FreeText key={definition.id} definition={definition} value={value} />
          ) : (
            <Scale key={definition.id} definition={definition} value={value} />
          )
        )}
      </div>
    </section>
  );
}

/** Version compacta para las cards del catalogo: solo iconos activos. */
export function AttributeChips({ definitions = [], attributes = {}, limit = 4 }) {
  const chips = [];

  for (const definition of definitions) {
    if (!definition.show_on_card) continue;
    const chosen = selectedValues(definition, attributes?.[definition.key]);
    if (chosen.length === 0) continue;

    const options = Array.isArray(definition.options) ? definition.options : [];
    for (const value of chosen) {
      const option = options.find((o) => String(o.value) === value);
      if (option) chips.push({ key: `${definition.key}-${value}`, definition, option });
    }
  }

  if (chips.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-center gap-2">
      {chips.slice(0, limit).map(({ key, definition, option }) => (
        <li key={key} className="text-ink-soft" title={`${definition.label}: ${option.label}`}>
          <ReferenceIcon name={option.icon} size={18} title={`${definition.label}: ${option.label}`} />
        </li>
      ))}
    </ul>
  );
}
