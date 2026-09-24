// src/app/item/[slug]/page.tsx
// Clean Product Ad Campaign Route — cafelittlekarachi.com/item/[slug]
// Directly loads the pre-rendered full menu catalog and automatically opens the product customization modal.

import MenuPage from "../../order/page";
import { getServerMenuData } from "@/lib/serverMenuData";

export const revalidate = 300;

interface ItemPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ItemPage({ params }: ItemPageProps) {
  const { slug } = await params;
  const initialData = await getServerMenuData();

  return <MenuPage initialItemSlug={slug} initialData={initialData} />;
}
