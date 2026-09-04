'use client';

import { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { STORAGE_BUCKET } from '@/lib/config';

/**
 * Sube directo a Supabase Storage con la sesion del usuario.
 * La carpeta raiz es el tenant_id, que es lo que valida la policy de storage.
 */
export default function ImageUploader({
  name,
  tenantId,
  folder = 'productos',
  multiple = false,
  defaultValue = '',
  label = 'Imágenes',
  hint,
}) {
  const initial = defaultValue
    ? String(defaultValue).split('\n').map((u) => u.trim()).filter(Boolean)
    : [];

  const [urls, setUrls] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  async function onFiles(event) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    setBusy(true);
    setError(null);
    const supabase = createClient();
    const uploaded = [];

    for (const file of files) {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `${tenantId}/${folder}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, { cacheControl: '31536000', upsert: false });

      if (uploadError) {
        setError(uploadError.message);
        break;
      }

      const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }

    setUrls((prev) => (multiple ? [...prev, ...uploaded] : uploaded.slice(-1)));
    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  function remove(url) {
    setUrls((prev) => prev.filter((u) => u !== url));
  }

  return (
    <div>
      <span className="text-sm font-medium text-ink">{label}</span>
      {hint && <span className="mt-0.5 block text-xs text-ink-soft">{hint}</span>}

      <input type="hidden" name={name} value={urls.join('\n')} />

      <div className="mt-2 flex flex-wrap gap-3">
        {urls.map((url) => (
          <div key={url} className="relative size-24 border border-line bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="size-full object-cover" />
            <button
              type="button"
              onClick={() => remove(url)}
              aria-label="Quitar imagen"
              className="absolute -right-2 -top-2 rounded-full bg-ink p-1 text-on-dark"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex size-24 flex-col items-center justify-center gap-1 border border-dashed border-line text-xs text-ink-soft hover:border-primary hover:text-primary disabled:opacity-50"
        >
          <Upload size={18} strokeWidth={1.75} />
          {busy ? 'Subiendo…' : 'Subir'}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={onFiles}
        className="sr-only"
      />

      {error && <p className="mt-2 text-sm text-accent">{error}</p>}
    </div>
  );
}
