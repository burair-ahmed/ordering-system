// src/app/platter/[slug]/page.tsx
// Clean Platter Ad Campaign Route — cafelittlekarachi.com/platter/[slug]
// Directly loads the full menu catalog and automatically opens the platter customization modal.

import MenuPage from "../../order/page";
import TableForm from "../../components/TableForm";

interface PlatterPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PlatterPage({ params }: PlatterPageProps) {
  const { slug } = await params;

  return (
    <>
      {/* Location selector modal (ready in background if customer wants to set location) */}
      <TableForm />
      {/* Full menu catalog with target platter modal opened */}
      <MenuPage initialPlatterSlug={slug} />
    </>
  );
}
