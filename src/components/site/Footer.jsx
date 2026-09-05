import Link from 'next/link';
import { Clock, Instagram, Mail, MapPin, Phone } from 'lucide-react';
import { copy } from '@/lib/content';
import {
  emailHref,
  instagramHandle,
  instagramHref,
  mapsHref,
  phoneHref,
  whatsappHref,
} from '@/lib/contact';

/** Glifo de WhatsApp: lucide no dibuja marcas. */
function WhatsAppIcon({ size = 20, className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m0 1.67c2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.42 5.83c0 4.54-3.7 8.23-8.25 8.23a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24M8.53 7.33c-.16 0-.43.06-.65.31-.22.24-.87.85-.87 2.07 0 1.22.89 2.39 1 2.56.14.17 1.72 2.62 4.18 3.68.58.25 1.04.4 1.4.51.58.19 1.11.16 1.53.1.47-.07 1.44-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.47-.28-.24-.12-1.44-.72-1.66-.8-.22-.08-.39-.12-.55.12-.16.24-.63.79-.77.96-.14.16-.28.18-.52.06-.24-.12-1.03-.38-1.96-1.21-.72-.65-1.21-1.45-1.35-1.69-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.32-.75-1.81-.2-.48-.4-.42-.55-.42h-.46Z" />
    </svg>
  );
}

/** Fila de dato: icono, texto y, si hay a donde ir, el link. */
function Line({ icon: Icon, label, children, href }) {
  if (!children) return null;
  const external = href?.startsWith('http');

  return (
    <div className="flex gap-3">
      <Icon size={17} strokeWidth={1.75} className="mt-0.5 shrink-0 text-on-dark/55" />
      <div className="min-w-0">
        <dt className="sr-only">{label}</dt>
        <dd className="whitespace-pre-line leading-relaxed text-on-dark/90">
          {href ? (
            <a
              href={href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noreferrer' : undefined}
              className="underline decoration-on-dark/30 underline-offset-4 transition-colors hover:decoration-on-dark"
            >
              {children}
            </a>
          ) : (
            children
          )}
        </dd>
      </div>
    </div>
  );
}

function ColumnTitle({ children }) {
  return <h2 className="caption text-[0.62rem] text-on-dark/60">{children}</h2>;
}

export default function Footer({ tenant, tree = [] }) {
  const s = tenant.settings ?? {};

  const wa = whatsappHref(s);
  const maps = mapsHref(s);
  const igHandle = instagramHandle(s);
  const families = tree.slice(0, 6);
  const footerNote = copy(s, 'footer_note');

  /* El vivero completa lo que quiere: cada columna aparece solo si tiene
     algo que decir, y el ancho se reparte entre las que quedaron. */
  const hasContact = Boolean(s.address || maps || s.opening_hours || s.phone || s.email);
  const hasNav = families.length > 0;
  const columns = Number(hasContact) + Number(hasNav);
  const grid = {
    2: 'lg:grid-cols-[1.15fr_1fr_0.8fr]',
    1: 'lg:grid-cols-[1.3fr_1fr]',
    0: '',
  }[columns];

  return (
    /* El pie es una seccion entera, no una tarjeta: el verde va de borde a
       borde y hasta el fondo. Adentro, el contenido se alinea con el resto
       del sitio (mismo max-w y mismo px que la barra de arriba). */
    <footer className="mt-20 bg-primary text-on-dark">
      <div className="mx-auto max-w-6xl px-5">
        <div
          className={`grid grid-cols-1 gap-10 py-12 md:grid-cols-2 md:py-16 lg:gap-12 ${grid}`}
        >
          {/* Marca */}
          <div className="min-w-0 md:col-span-2 lg:col-span-1">
            <Link href="/" aria-label={tenant.name} className="inline-flex">
              {s.logo_dark_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.logo_dark_url}
                  alt={tenant.name}
                  className="h-9 w-auto max-w-full object-contain object-left md:h-11"
                />
              ) : s.logo_url ? (
                /* El logo suele venir en el color de la marca: sobre el
                   bloque oscuro va en su propia placa, como un cartel. */
                <span className="inline-flex rounded-card bg-on-dark px-5 py-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.logo_url}
                    alt={tenant.name}
                    className="h-8 w-auto max-w-full object-contain md:h-9"
                  />
                </span>
              ) : (
                <span className="font-display text-3xl leading-none md:text-4xl">
                  {tenant.name}
                </span>
              )}
            </Link>

            <div className="mt-6 h-0.5 w-14 rounded-pill bg-accent" />

            {s.about && (
              <p className="mt-5 max-w-[46ch] text-[0.95rem] leading-relaxed text-on-dark/80">
                {s.about}
              </p>
            )}

            {igHandle && (
              <a
                href={instagramHref(s)}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-pill border border-on-dark/25 px-4 py-2 text-sm transition-colors hover:border-on-dark/60 hover:bg-on-dark/10"
              >
                <Instagram size={16} strokeWidth={1.75} />
                <span>@{igHandle}</span>
              </a>
            )}
          </div>

          {/* Donde estamos */}
          {hasContact && (
            <div className="min-w-0">
              <ColumnTitle>{copy(s, 'footer_contact_title')}</ColumnTitle>
              <dl className="mt-5 space-y-4 text-[0.95rem]">
                <Line icon={MapPin} label="Dirección" href={maps}>
                  {s.address || (maps ? 'Ver en el mapa' : null)}
                </Line>
                <Line icon={Clock} label="Horarios">
                  {s.opening_hours}
                </Line>
                <Line icon={WhatsAppIcon} label="WhatsApp" href={wa}>
                  {s.whatsapp}
                </Line>
                <Line icon={Phone} label="Teléfono" href={phoneHref(s)}>
                  {s.phone}
                </Line>
                <Line icon={Mail} label="Email" href={emailHref(s)}>
                  {s.email}
                </Line>
              </dl>
            </div>
          )}

          {/* Catalogo */}
          {hasNav && (
            <nav aria-label={copy(s, 'footer_nav_title')} className="min-w-0">
              <ColumnTitle>{copy(s, 'footer_nav_title')}</ColumnTitle>
              <ul className="mt-5 space-y-2.5 text-[0.95rem]">
                {families.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/categoria/${cat.slug}`}
                      className="text-on-dark/85 transition-colors hover:text-on-dark"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
                <li className="pt-1">
                  <Link
                    href="/catalogo"
                    className="caption text-[0.62rem] underline underline-offset-4 hover:text-on-dark"
                  >
                    Ver todo
                  </Link>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </div>

      {/* Invitacion a escribir */}
      {(wa || maps) && (
        <div className="border-t border-on-dark/15">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-9 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-display text-2xl leading-tight md:text-3xl">
                {copy(s, 'footer_title')}
              </p>
              {footerNote && (
                <p className="mt-1.5 text-[0.95rem] text-on-dark/75">{footerNote}</p>
              )}
            </div>
            <a
              href={wa || maps}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-2.5 rounded-pill bg-on-dark px-7 py-3.5 text-sm font-medium text-primary-deep transition-opacity hover:opacity-90"
            >
              {wa ? <WhatsAppIcon size={19} /> : <MapPin size={18} strokeWidth={1.75} />}
              {wa ? copy(s, 'footer_cta') : 'Cómo llegar'}
            </a>
          </div>
        </div>
      )}

      {/* La linea de siempre, ya adentro del verde */}
      <div className="border-t border-on-dark/15">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-on-dark/60">
          <span>
            © {new Date().getFullYear()} {tenant.name}
          </span>
          <Link href="/admin" className="transition-colors hover:text-on-dark">
            Panel
          </Link>
        </div>
      </div>
    </footer>
  );
}
