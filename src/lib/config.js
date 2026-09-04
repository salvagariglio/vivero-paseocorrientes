// Configuracion de plataforma. Todo lo de marca/negocio vive en la DB.
// Aca solo va lo que es infraestructura.

export const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000').toLowerCase();

// Hosts que NO son de un vivero: landing de la plataforma.
export const PLATFORM_HOSTS = (process.env.NEXT_PUBLIC_PLATFORM_HOSTS || '')
  .split(',')
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

// Fallback para desarrollo local sin subdominios (ej: DEV_TENANT_SLUG=vivero-demo)
export const DEV_TENANT_SLUG = process.env.NEXT_PUBLIC_DEV_TENANT_SLUG || null;

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const STORAGE_BUCKET = 'media';
