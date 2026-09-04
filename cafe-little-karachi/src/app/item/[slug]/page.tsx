// src/app/item/[slug]/page.tsx
// Clean Product Ad Campaign Route — cafelittlekarachi.com/item/[slug]
// Directly loads the full menu catalog and automatically opens the product customization modal.

import MenuPage from "../../order/page";
import TableForm from "../../components/TableForm";

interface ItemPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ItemPage({ params }: ItemPageProps) {
  const { slug } = await params;

  return (
    <>
      {/* Location selector modal (ready in background if customer wants to set location) */}
      <TableForm />
      {/* Full menu catalog with the target item modal opened */}
      <MenuPage initialItemSlug={slug} />
    </>
  );
}
