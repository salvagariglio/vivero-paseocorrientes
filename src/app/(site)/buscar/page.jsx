import { redirect } from 'next/navigation';

/** El buscador vive dentro del catalogo; esta ruta queda por links viejos. */
export default async function SearchRedirect({ searchParams }) {
  const { q = '' } = await searchParams;
  redirect(q ? `/catalogo?q=${encodeURIComponent(q)}` : '/catalogo');
}
