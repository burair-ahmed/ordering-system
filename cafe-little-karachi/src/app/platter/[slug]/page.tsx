// src/app/platter/[slug]/page.tsx
// Clean Platter Ad Campaign Route — cafelittlekarachi.com/platter/[slug]
// Directly loads the pre-rendered full menu catalog and automatically opens the platter customization modal.
// TableForm is mounted globally in layout.tsx — no need to render it here.

import type { Metadata } from 'next';
import MenuPage from "../../order/page";
import { getServerMenuData } from "@/lib/serverMenuData";
import { generatePlatterMetadata } from "@/lib/seoHelpers";

export const revalidate = 300;

interface PlatterPageProps {
  params: Promise<{ slug: string }>;
}

// ─── Dynamic SEO Metadata ────────────────────────────────────────────────────
export async function generateMetadata({ params }: PlatterPageProps): Promise<Metadata> {
  const { slug } = await params;
  return generatePlatterMetadata(slug);
}

// ─── Page Component ──────────────────────────────────────────────────────────
export default async function PlatterPage({ params }: PlatterPageProps) {
  const { slug } = await params;
  const initialData = await getServerMenuData();

  return <MenuPage initialPlatterSlug={slug} initialData={initialData} />;
}
