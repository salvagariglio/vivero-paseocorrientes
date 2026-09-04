import { formatPrice, promoState } from '@/lib/format';

export default function PriceTag({ product, settings, size = 'md' }) {
  if (!settings?.show_prices) return null;

  const promo = promoState(product);
  const effective = formatPrice(promo.effective, settings);
  if (!effective) return null;

  const scale = size === 'lg' ? 'text-2xl' : 'text-base';

  if (!promo.active) {
    return <p className={`${scale} font-medium tabular-nums text-ink`}>{effective}</p>;
  }

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <p className={`${scale} font-medium tabular-nums text-accent`}>{effective}</p>
      {promo.price != null && (
        <p className="text-sm tabular-nums text-ink-soft line-through decoration-1">
          {formatPrice(promo.price, settings)}
        </p>
      )}
    </div>
  );
}

export function PromoBadge({ product }) {
  const promo = promoState(product);
  if (!promo.active) return null;

  const text = promo.label || (promo.discount ? `${promo.discount}% menos` : 'Promo');

  return (
    <span className="inline-flex items-center bg-accent px-2 py-1 text-[0.7rem] font-medium tracking-wide text-on-dark">
      {text}
    </span>
  );
}
