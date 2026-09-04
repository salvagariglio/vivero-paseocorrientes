import Link from 'next/link';

function Row({ label, children }) {
  if (!children) return null;
  return (
    <div className="flex gap-4 border-t border-on-dark/15 py-2.5 first:border-t-0">
      <dt className="caption w-24 shrink-0 pt-0.5 text-[0.6rem] opacity-70">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export default function Footer({ tenant }) {
  const s = tenant.settings ?? {};
  const wa = s.whatsapp ? String(s.whatsapp).replace(/\D/g, '') : null;
  const ig = s.instagram ? String(s.instagram).replace(/^@/, '') : null;

  return (
    <footer className="mt-20">
      <div className="mx-auto max-w-6xl px-5 pb-8">
        <div className="rounded-lg bg-primary px-8 py-12 text-on-dark">
          <div className="grid gap-10 md:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="font-display text-4xl leading-tight">{tenant.name}</p>
              <div className="mt-4 h-0.5 w-14 rounded-pill bg-accent" />
              {s.about && (
                <p className="mt-5 max-w-[48ch] text-[0.95rem] leading-relaxed opacity-85">
                  {s.about}
                </p>
              )}
            </div>

            <dl className="text-[0.95rem]">
              <Row label="Dónde">
                {s.maps_url ? (
                  <a href={s.maps_url} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                    {s.address || 'Ver en el mapa'}
                  </a>
                ) : (
                  s.address
                )}
              </Row>
              <Row label="Horarios">{s.opening_hours}</Row>
              <Row label="WhatsApp">
                {wa && (
                  <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="underline underline-offset-4">
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
                    className="underline underline-offset-4"
                  >
                    @{ig}
                  </a>
                )}
              </Row>
              <Row label="Email">
                {s.email && (
                  <a href={`mailto:${s.email}`} className="underline underline-offset-4">
                    {s.email}
                  </a>
                )}
              </Row>
            </dl>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 px-2 text-xs text-earth">
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
