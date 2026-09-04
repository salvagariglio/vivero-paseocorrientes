import ReferenceIcon from '@/components/icons/ReferenceIcon';

/**
 * Replica el cartel de referencias del local: banda verde, fichas en
 * arena, escala completa con el riel punteado y un punto en la opcion
 * que corresponde. El cliente ve lo mismo en la planta y en el telefono.
 */

function selectedValues(value) {
  if (value === null || value === undefined) return [];
  return Array.isArray(value) ? value.map(String) : [String(value)];
}

function Scale({ definition, value }) {
  const chosen = selectedValues(value);
  const options = Array.isArray(definition.options) ? definition.options : [];
  if (options.length === 0) return null;

  return (
    <div className="panel px-5 pb-5 pt-6">
      <h3 className="text-center font-display text-xl leading-none text-primary-deep">
        {definition.label}
      </h3>
      <div className="mx-auto mt-2.5 h-px w-24 bg-primary/30" />

      <ul className="mt-6 flex items-end justify-center gap-1">
        {options.map((option) => {
          const active = chosen.includes(String(option.value));
          return (
            <li key={option.value} className="flex min-w-0 flex-1 flex-col items-center">
              <ReferenceIcon
                name={option.icon}
                size={34}
                title={option.label}
                className={active ? 'text-primary' : 'text-primary/25'}
              />

              {/* Riel punteado con el punto en la opcion elegida */}
              <div className="relative mt-3 flex h-2 w-full items-center justify-center">
                <span aria-hidden className="absolute inset-x-0 top-1/2 border-t border-dashed border-primary/30" />
                <span
                  aria-hidden
                  className={`relative size-2 rounded-full ${
                    active ? 'bg-primary' : 'bg-primary/25'
                  }`}
                />
              </div>

              <span
                className={`caption mt-2 text-center text-[0.6rem] leading-tight ${
                  active ? 'text-primary-deep' : 'text-earth/60'
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
    <div className="panel px-5 pb-5 pt-6">
      <h3 className="text-center font-display text-xl leading-none text-primary-deep">
        {definition.label}
      </h3>
      <div className="mx-auto mt-2.5 h-px w-24 bg-primary/30" />
      <p className="mt-5 text-center text-sm leading-relaxed text-ink">{String(value)}</p>
    </div>
  );
}

export default function AttributeReferences({
  definitions = [],
  attributes = {},
  title = 'Referencias',
}) {
  const rows = definitions
    .map((definition) => ({ definition, value: attributes?.[definition.key] }))
    .filter(({ value }) =>
      Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && value !== ''
    );

  if (rows.length === 0) return null;

  return (
    <section className="mt-16">
      <div className="band px-8 py-4">
        <h2 className="text-center font-display text-2xl leading-none">{title}</h2>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    const chosen = selectedValues(attributes?.[definition.key]);
    if (chosen.length === 0) continue;

    const options = Array.isArray(definition.options) ? definition.options : [];
    for (const value of chosen) {
      const option = options.find((o) => String(o.value) === value);
      if (option) chips.push({ key: `${definition.key}-${value}`, definition, option });
    }
  }

  if (chips.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-center gap-1.5">
      {chips.slice(0, limit).map(({ key, definition, option }) => (
        <li key={key} className="text-primary/70" title={`${definition.label}: ${option.label}`}>
          <ReferenceIcon name={option.icon} size={19} title={`${definition.label}: ${option.label}`} />
        </li>
      ))}
    </ul>
  );
}
