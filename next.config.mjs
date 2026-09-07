/** @type {import('next').NextConfig} */
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig = {
  experimental: {
    // La lista de precios viaja por una server action: el .xlsx al
    // previsualizar y el detalle fila por fila al aplicar. Con el limite
    // de 1 MB por defecto una planilla grande se cae sin explicacion.
    serverActions: { bodySizeLimit: '8mb' },
  },
  images: {
    remotePatterns: [
      ...(supabaseHost
        ? [{ protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }]
        : []),
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

export default nextConfig;
