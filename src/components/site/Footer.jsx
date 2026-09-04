import Link from 'next/link';

function Row({ label, children }) {
  if (!children) return null;
  return (
    <div className="flex gap-3 py-2">
      <dt className="w-24 shrink-0 text-ink-soft">{label}</dt>
      <dd className="text-ink">{children}</dd>
    </div>
  );
}

export default function Footer({ tenant }) {
  const s = tenant.settings ?? {};
  const wa = s.whatsapp ? String(s.whatsapp).replace(/\D/g, '') : null;
  const ig = s.instagram ? String(s.instagram).replace(/^@/, '') : null;

  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="font-display text-3xl leading-tight text-ink">{tenant.name}</p>
          {s.about && (
            <p className="mt-4 max-w-[52ch] text-[0.95rem] leading-relaxed text-ink-soft">
              {s.about}
            </p>
          )}
        </div>

        <dl className="divide-y divide-line/70 text-[0.95rem]">
          <Row label="Dónde">
            {s.maps_url ? (
              <a href={s.maps_url} target="_blank" rel="noreferrer" className="hover:text-primary">
                {s.address || 'Ver en el mapa'}
              </a>
            ) : (
              s.address
            )}
          </Row>
          <Row label="Horarios">{s.opening_hours}</Row>
          <Row label="WhatsApp">
            {wa && (
              <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="hover:text-primary">
                {s.whatsapp}
              </a>
            )}
          </Row>
          <Row label="Instagram">
            {ig && (
              <a
                href={`https://instagram.com/${ig}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-primary"
              >
                @{ig}
              </a>
            )}
          </Row>
          <Row label="Email">
            {s.email && (
              <a href={`mailto:${s.email}`} className="hover:text-primary">
                {s.email}
              </a>
            )}
          </Row>
        </dl>
      </div>

      <div className="border-t border-line/70">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5 text-xs text-ink-soft">
          <span>
            © {new Date().getFullYear()} {tenant.name}
          </span>
          <Link href="/admin" className="hover:text-primary">
            Panel
          </Link>
        </div>
      </div>
    </footer>
  );
}
