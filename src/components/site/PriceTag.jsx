import { formatPrice, promoState } from '@/lib/format';

export default function PriceTag({ product, settings, size = 'md' }) {
  if (!settings?.show_prices) return null;

  const promo = promoState(product);
  const effective = formatPrice(promo.effective, settings);
  if (!effective) return null;

  const scale = size === 'lg' ? 'text-2xl' : 'text-base';

  if (!promo.active) {
    return <p className={`${scale} font-medium tabular-nums text-primary-deep`}>{effective}</p>;
  }

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <p className={`${scale} font-medium tabular-nums text-accent`}>{effective}</p>
      {promo.price != null && (
        <p className="text-sm tabular-nums text-earth line-through decoration-1">
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
    <span className="caption inline-flex items-center rounded-pill bg-accent px-3 py-1 text-[0.6rem] text-on-dark">
      {text}
    </span>
  );
}
