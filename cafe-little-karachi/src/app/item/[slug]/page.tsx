// src/app/item/[slug]/page.tsx
// Clean Product Ad Campaign Route — cafelittlekarachi.com/item/[slug]
// Directly loads the pre-rendered full menu catalog and automatically opens the product customization modal.

import type { Metadata } from 'next';
import MenuPage from "../../order/page";
import { getServerMenuData } from "@/lib/serverMenuData";
import { generateItemMetadata } from "@/lib/seoHelpers";

export const revalidate = 300;

interface ItemPageProps {
  params: Promise<{ slug: string }>;
}

// ─── Dynamic SEO Metadata ────────────────────────────────────────────────────
export async function generateMetadata({ params }: ItemPageProps): Promise<Metadata> {
  const { slug } = await params;
  return generateItemMetadata(slug);
}

// ─── Page Component ──────────────────────────────────────────────────────────
export default async function ItemPage({ params }: ItemPageProps) {
  const { slug } = await params;
  const initialData = await getServerMenuData();

  return <MenuPage initialItemSlug={slug} initialData={initialData} />;
}
