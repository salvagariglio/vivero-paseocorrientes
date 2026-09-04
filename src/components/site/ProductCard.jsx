import Link from 'next/link';
import Image from 'next/image';
import PriceTag, { PromoBadge } from './PriceTag';
import { AttributeChips } from './AttributeReferences';

export default function ProductCard({ product, settings, definitions = [], priority = false }) {
  return (
    <Link
      href={`/planta/${product.slug}`}
      className="group flex flex-col bg-card ring-1 ring-line/70 transition-shadow hover:shadow-[0_12px_28px_-18px_rgba(22,36,28,0.55)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-alt">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 90vw"
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-display text-5xl text-line">{product.name.charAt(0)}</span>
          </div>
        )}

        <div className="absolute left-0 top-3">
          <PromoBadge product={product} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 border-t border-line/70 px-4 py-4">
        <h3 className="font-display text-xl leading-snug text-ink">{product.name}</h3>

        {product.scientific_name && (
          <p className="binomial text-sm leading-tight">{product.scientific_name}</p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <PriceTag product={product} settings={settings} />
          <AttributeChips definitions={definitions} attributes={product.attributes} />
        </div>
      </div>
    </Link>
  );
}
