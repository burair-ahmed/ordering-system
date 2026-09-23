// src/app/platter/[slug]/page.tsx
// Clean Platter Ad Campaign Route — cafelittlekarachi.com/platter/[slug]
// Directly loads the full menu catalog and automatically opens the platter customization modal.
// TableForm is mounted globally in layout.tsx — no need to render it here.

import MenuPage from "../../order/page";

interface PlatterPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PlatterPage({ params }: PlatterPageProps) {
  const { slug } = await params;

  return (
    // Full menu catalog with target platter modal opened
    <MenuPage initialPlatterSlug={slug} />
  );
}

