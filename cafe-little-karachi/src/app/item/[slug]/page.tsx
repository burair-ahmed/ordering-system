// src/app/item/[slug]/page.tsx
// Clean Product Ad Campaign Route — cafelittlekarachi.com/item/[slug]
// Directly loads the full menu catalog and automatically opens the product customization modal.

import MenuPage from "../../order/page";

interface ItemPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ItemPage({ params }: ItemPageProps) {
  const { slug } = await params;

  return <MenuPage initialItemSlug={slug} />;
}
