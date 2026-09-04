'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';

function Branch({ node, depth = 0, onNavigate }) {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = node.children?.length > 0;

  return (
    <li>
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/categoria/${node.slug}`}
          onClick={onNavigate}
          className={
            depth === 0
              ? 'font-display text-2xl leading-tight text-ink hover:text-primary transition-colors'
              : 'text-[0.95rem] text-ink-soft hover:text-primary transition-colors'
          }
        >
          {node.name}
        </Link>

        {hasChildren && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? `Contraer ${node.name}` : `Expandir ${node.name}`}
            className="shrink-0 rounded-full p-1 text-ink-soft hover:bg-black/5"
          >
            <ChevronDown
              size={16}
              className={`transition-transform ${open ? '' : '-rotate-90'}`}
            />
          </button>
        )}
      </div>

      {hasChildren && open && (
        <ul className="mt-2 ml-3 space-y-2 border-l border-line pl-4">
          {node.children.map((child) => (
            <Branch key={child.id} node={child} depth={depth + 1} onNavigate={onNavigate} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function CatalogDrawer({ tree = [], tenantName, footerLinks = [] }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="catalogo-drawer"
        className="-mr-1 flex items-center gap-2 rounded-full px-3 py-2 text-ink hover:bg-black/5 transition-colors"
      >
        <Menu size={20} strokeWidth={1.75} />
        <span className="text-sm font-medium">Catálogo</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Cerrar catálogo"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
          />

          <div
            id="catalogo-drawer"
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Categorías"
            className="absolute inset-y-0 left-0 flex w-[min(24rem,88vw)] flex-col bg-surface shadow-2xl outline-none"
          >
            <div className="flex items-baseline justify-between border-b border-line px-6 py-5">
              <span className="font-display text-lg text-ink-soft">{tenantName}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-ink hover:bg-black/5"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-6 py-6">
              {tree.length === 0 ? (
                <p className="text-sm text-ink-soft">
                  Todavía no hay categorías cargadas.
                </p>
              ) : (
                <ul className="space-y-5">
                  {tree.map((node) => (
                    <Branch key={node.id} node={node} onNavigate={() => setOpen(false)} />
                  ))}
                </ul>
              )}
            </nav>

            {footerLinks.length > 0 && (
              <div className="border-t border-line px-6 py-5 text-sm">
                <ul className="space-y-2">
                  {footerLinks.map((l) => (
                    <li key={l.href}>
                      <a
                        href={l.href}
                        target={l.external ? '_blank' : undefined}
                        rel={l.external ? 'noreferrer' : undefined}
                        className="text-ink-soft hover:text-primary"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
