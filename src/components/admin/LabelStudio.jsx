'use client';

import { useMemo, useState } from 'react';
import { Printer } from 'lucide-react';
import { formatPrice, promoState } from '@/lib/format';
import { resolveTheme } from '@/lib/theme';
import ReferenceIcon from '@/components/icons/ReferenceIcon';

/**
 * Genera la hoja de etiquetas. Las medidas y los colores salen de
 * label_templates + tenant_settings.theme, asi que cada vivero imprime
 * en su papel y con su marca.
 */
export default function LabelStudio({ tenant, products, templates, definitions = [] }) {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? null);
  const [selected, setSelected] = useState({});
  const [filter, setFilter] = useState('');

  const template = templates.find((t) => t.id === templateId) ?? templates[0];
  const theme = useMemo(() => resolveTheme(tenant.settings?.theme), [tenant.settings?.theme]);

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || (p.scientific_name || '').toLowerCase().includes(q)
    );
  }, [products, filter]);

  const sheet = useMemo(() => {
    const out = [];
    for (const product of products) {
      const qty = selected[product.id] ?? 0;
      for (let i = 0; i < qty; i += 1) out.push({ product, key: `${product.id}-${i}` });
    }
    return out;
  }, [products, selected]);

  function setQty(id, value) {
    const qty = Math.max(0, Math.min(200, Number(value) || 0));
    setSelected((prev) => ({ ...prev, [id]: qty }));
  }

  if (!template) {
    return (
      <p className="rounded-card border border-dashed border-line p-8 text-center text-ink-soft">
        Creá una plantilla de etiqueta para empezar a imprimir.
      </p>
    );
  }

  // El CSS se inyecta como texto, asi que ningun valor de la DB llega crudo:
  // los numeros pasan por mm() y el tamano de pagina por una lista blanca.
  const mm = (value, fallback) => {
    const n = Number(value);
    return `${Number.isFinite(n) && n > 0 ? Math.min(n, 500) : fallback}mm`;
  };
  const pageSize = ['A4', 'Letter'].includes(template.page_size) ? template.page_size : 'A4';

  const css = `
    @media print {
      @page { size: ${pageSize}; margin: ${mm(template.margin_mm, 8)}; }
    }
    .label-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, ${mm(template.width_mm, 50)});
      gap: ${mm(template.gap_mm, 4)};
      justify-content: start;
    }
    .label {
      width: ${mm(template.width_mm, 50)};
      height: ${mm(template.height_mm, 80)};
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .label-qr { width: ${mm(template.qr_mm, 22)}; height: ${mm(template.qr_mm, 22)}; }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="no-print">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-ink">Plantilla</span>
            <select
              value={templateId ?? ''}
              onChange={(e) => setTemplateId(e.target.value)}
              className="mt-1.5 w-full rounded-card border border-line bg-card px-3 py-2.5 text-ink"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} · {t.width_mm}×{t.height_mm} mm
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-ink">Buscar planta</span>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Monstera, cactus…"
              className="mt-1.5 w-full rounded-card border border-line bg-card px-3 py-2.5 text-ink"
            />
          </label>
        </div>

        <div className="mt-6 max-h-96 overflow-y-auto rounded-card border border-line bg-card">
          <ul className="divide-y divide-line">
            {visible.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">{p.name}</p>
                  {p.scientific_name && (
                    <p className="binomial truncate text-xs">{p.scientific_name}</p>
                  )}
                </div>
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={selected[p.id] ?? 0}
                  onChange={(e) => setQty(p.id, e.target.value)}
                  aria-label={`Cantidad de etiquetas de ${p.name}`}
                  className="w-20 border border-line px-2 py-1.5 text-right text-sm tabular-nums"
                />
              </li>
            ))}
            {visible.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-ink-soft">
                Ninguna planta coincide con esa búsqueda.
              </li>
            )}
          </ul>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => window.print()}
            disabled={sheet.length === 0}
            className="inline-flex items-center gap-2 rounded-pill bg-primary px-5 py-2.5 text-sm font-medium text-on-dark hover:opacity-90 disabled:opacity-40"
          >
            <Printer size={16} strokeWidth={1.75} />
            Imprimir {sheet.length || ''} {sheet.length === 1 ? 'etiqueta' : 'etiquetas'}
          </button>
          {sheet.length > 0 && (
            <button
              type="button"
              onClick={() => setSelected({})}
              className="text-sm text-ink-soft underline underline-offset-4 hover:text-ink"
            >
              Vaciar selección
            </button>
          )}
        </div>

        <h2 className="mt-10 border-t border-line pt-6 font-display text-2xl leading-none text-ink">
          Vista previa
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          Así sale en el papel. Al imprimir se oculta todo lo demás.
        </p>
      </div>

      <div className="print-sheet mt-6">
        {sheet.length === 0 ? (
          <p className="no-print rounded-card border border-dashed border-line p-10 text-center text-sm text-ink-soft">
            Elegí cuántas etiquetas querés de cada planta.
          </p>
        ) : (
          <div className="label-grid">
            {sheet.map(({ product, key }) => (
              <Label
                key={key}
                product={product}
                tenant={tenant}
                template={template}
                theme={theme}
                definitions={definitions}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/** Luminancia relativa, para saber si un fondo es claro u oscuro. */
function isLight(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex ?? '');
  if (!m) return true;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) > 0.4;
}

function Label({ product, tenant, template, theme, definitions }) {
  const s = tenant.settings ?? {};
  const promo = promoState(product);
  const price = s.show_prices && template.show_price ? formatPrice(promo.effective, s) : null;

  const bg = theme[template.bg_token] ?? theme.card;
  const fg = theme[template.fg_token] ?? theme.ink;
  const accent = theme[template.accent_token] ?? theme.accent;

  // El QR se pide en los colores de la etiqueta para que no corte el diseno.
  const qr = `/api/qr?slug=${encodeURIComponent(product.slug)}&size=512&dark=${encodeURIComponent(
    fg
  )}&light=${encodeURIComponent(bg)}`;

  const refs = [];
  for (const definition of definitions) {
    if (!definition.show_on_label) continue;
    const value = product.attributes?.[definition.key];
    const chosen = Array.isArray(value) ? value : value != null ? [value] : [];
    const options = Array.isArray(definition.options) ? definition.options : [];
    for (const v of chosen) {
      const option = options.find((o) => String(o.value) === String(v));
      if (option) refs.push({ key: `${definition.key}-${v}`, option, definition });
    }
  }

  return (
    <div
      className="label relative flex flex-col items-center px-2 pb-2 pt-5 text-center"
      style={{ background: bg, color: fg, border: `0.4mm solid ${accent}22` }}
    >
      {template.show_logo &&
        (s.logo_url && isLight(bg) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.logo_url} alt="" className="mb-1 h-4 w-auto object-contain" />
        ) : (
          <p className="caption mb-1 text-[5.5pt] uppercase tracking-[0.18em]" style={{ opacity: 0.7 }}>
            {tenant.name}
          </p>
        ))}

      <p className="font-display text-[11pt] leading-tight">{product.name}</p>

      {template.show_scientific && product.scientific_name && (
        <p className="binomial text-[6.5pt] leading-tight" style={{ color: fg, opacity: 0.75 }}>
          {product.scientific_name}
        </p>
      )}

      {template.show_description && product.short_description && (
        <p className="mt-1 text-[6pt] leading-snug" style={{ opacity: 0.8 }}>
          {product.short_description}
        </p>
      )}

      {refs.length > 0 && (
        <ul className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5">
          {refs.slice(0, 5).map(({ key, option, definition }) => (
            <li key={key} title={`${definition.label}: ${option.label}`}>
              <ReferenceIcon name={option.icon} size={15} />
            </li>
          ))}
        </ul>
      )}

      {price && (
        <p className="mt-1 text-[10pt] font-medium tabular-nums" style={{ color: accent }}>
          {price}
        </p>
      )}

      <div className="mt-auto flex flex-col items-center gap-0.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt="" className="label-qr" />
        <p className="caption text-[5pt] uppercase tracking-[0.1em]" style={{ opacity: 0.6 }}>
          Escaneá para ver los cuidados
        </p>
      </div>
    </div>
  );
}
