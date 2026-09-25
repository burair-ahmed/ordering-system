/**
 * src/app/components/ProductJsonLd.tsx
 *
 * Dynamic Product + MenuItem + BreadcrumbList JSON-LD for individual
 * dish (/item/[slug]) and platter (/platter/[slug]) pages.
 *
 * Renders server-side — no 'use client' required.
 * Produces rich results eligible for:
 *   - Google Shopping / Product Rich Results
 *   - Product availability & price snippets in SERP
 *   - Breadcrumb display in SERP
 */

const BASE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://cafelittlekarachi.com'
).replace(/\/+$/, '');

interface ProductJsonLdProps {
  /** 'item' for /item/[slug], 'platter' for /platter/[slug] */
  type: 'item' | 'platter';
  slug: string;
  name: string;
  description?: string;
  image?: string;
  /** Starting / base price in PKR */
  price: number;
  /** Availability — defaults to InStock */
  inStock?: boolean;
  /** Category label e.g. "Biryani", "Sharing Platters" */
  category?: string;
  /** Variations for showing AggregateOffer when multiple prices exist */
  variations?: { name: string; price: string | number }[];
}

export default function ProductJsonLd({
  type,
  slug,
  name,
  description,
  image,
  price,
  inStock = true,
  category,
  variations,
}: ProductJsonLdProps) {
  const pageUrl = `${BASE_URL}/${type === 'item' ? 'item' : 'platter'}/${slug}`;
  const imageUrl =
    image ||
    'https://res.cloudinary.com/dubg6octv/image/upload/v1790323590/cafe-little-karachi/seo/clk_og_banner.jpg';

  const availability = inStock
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock';

  // Build offers — AggregateOffer if variations exist, else single Offer
  const variationPrices = variations
    ?.map((v) => Number(v.price))
    .filter((p) => !isNaN(p) && p > 0) ?? [];

  const offerBlock =
    variationPrices.length > 1
      ? {
          '@type': 'AggregateOffer',
          priceCurrency: 'PKR',
          lowPrice: Math.min(price, ...variationPrices),
          highPrice: Math.max(price, ...variationPrices),
          offerCount: variationPrices.length + 1,
          availability,
          url: pageUrl,
          seller: {
            '@type': 'Organization',
            name: 'Little Karachi Express',
          },
        }
      : {
          '@type': 'Offer',
          priceCurrency: 'PKR',
          price: String(price),
          availability,
          url: pageUrl,
          priceValidUntil: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString().split('T')[0],
          seller: {
            '@type': 'Organization',
            name: 'Little Karachi Express',
          },
        };

  // Product / MenuItem schema
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': ['Product', 'MenuItem'],
    '@id': `${pageUrl}/#product`,
    name,
    description: description || `${name} available at Little Karachi Express, Karachi.`,
    image: [imageUrl],
    url: pageUrl,
    brand: {
      '@type': 'Brand',
      name: 'Little Karachi Express',
    },
    ...(category ? { category } : {}),
    offers: offerBlock,
    // MenuItem-specific fields
    suitableForDiet: 'https://schema.org/HalalDiet',
    nutrition: {
      '@type': 'NutritionInformation',
      description: 'Nutritional information available on request.',
    },
  };

  // Breadcrumb schema for this product/platter page
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: BASE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: type === 'item' ? 'Menu' : 'Platters',
        item: `${BASE_URL}/`,
      },
      ...(category
        ? [
            {
              '@type': 'ListItem',
              position: 3,
              name: category,
              item: `${BASE_URL}/`,
            },
            {
              '@type': 'ListItem',
              position: 4,
              name,
              item: pageUrl,
            },
          ]
        : [
            {
              '@type': 'ListItem',
              position: 3,
              name,
              item: pageUrl,
            },
          ]),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}
