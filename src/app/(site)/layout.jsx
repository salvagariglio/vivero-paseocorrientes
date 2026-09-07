import TopBar from '@/components/site/TopBar';
import Footer from '@/components/site/Footer';
import { requireTenant } from '@/lib/tenant';
import { getCategoryTree } from '@/lib/queries';

export default async function SiteLayout({ children }) {
  const tenant = await requireTenant();
  const tree = await getCategoryTree(tenant.id);

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar tenant={tenant} tree={tree} />
      <main className="flex-1">{children}</main>
      <Footer tenant={tenant} tree={tree} />
    </div>
  );
}
