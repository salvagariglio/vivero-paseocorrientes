'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function ProductGallery({ images = [], name }) {
  const [active, setActive] = useState(0);
  const current = images[active];

  if (!current) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center rounded-lg bg-surface-alt">
        <span className="font-display text-7xl text-primary/20">{name.charAt(0)}</span>
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-surface-alt">
        <Image
          src={current.url}
          alt={current.alt || name}
          fill
          sizes="(min-width: 1024px) 520px, 100vw"
          priority
          className="object-cover"
        />
      </div>

      {images.length > 1 && (
        <ul className="mt-3 flex gap-3 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <li key={img.id ?? img.url}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Ver imagen ${i + 1} de ${name}`}
                aria-current={i === active}
                className={`relative block h-20 w-16 overflow-hidden rounded-sm ring-1 transition-all ${
                  i === active ? 'ring-2 ring-primary' : 'ring-line hover:ring-earth'
                }`}
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
