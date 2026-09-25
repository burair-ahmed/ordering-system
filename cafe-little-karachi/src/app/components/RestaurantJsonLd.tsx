/**
 * src/app/components/RestaurantJsonLd.tsx
 *
 * Injects a Schema.org Restaurant + FoodEstablishment + WebSite JSON-LD
 * structured data block into the page <head>. Renders server-side with zero
 * client-side JS overhead (no 'use client' directive).
 *
 * Produces rich results eligible for:
 *   - Google Restaurant Knowledge Panel
 *   - Google Maps integration
 *   - Google Sitelinks Searchbox
 *   - OrderAction / Online Ordering eligibility
 */

const BASE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://cafelittlekarachi.com'
).replace(/\/+$/, '');

export default function RestaurantJsonLd() {
  const restaurantSchema = {
    '@context': 'https://schema.org',
    '@type': ['Restaurant', 'FoodEstablishment'],
    '@id': `${BASE_URL}/#restaurant`,
    name: 'Little Karachi Express',
    alternateName: ['Cafe Little Karachi', 'CLK', 'LK Express'],
    description:
      'Authentic Karachi food — biryani, gourmet platters, karahi, BBQ, and fast food. Premium dine-in, takeaway, and express delivery across Karachi.',
    url: BASE_URL,
    logo: {
      '@type': 'ImageObject',
      url: 'https://res.cloudinary.com/dubg6octv/image/upload/v1790323622/cafe-little-karachi/seo/clk_hd_logo.webp',
      width: 512,
      height: 512,
    },
    image: [
      'https://res.cloudinary.com/dubg6octv/image/upload/v1790323590/cafe-little-karachi/seo/clk_og_banner.jpg',
      'https://res.cloudinary.com/dubg6octv/image/upload/v1790323622/cafe-little-karachi/seo/clk_hd_logo.webp',
    ],
    telephone: '+923331702706',
    priceRange: 'PKR 200 – PKR 3000',
    currenciesAccepted: 'PKR',
    paymentAccepted: 'Cash, Online Payment',
    servesCuisine: [
      'Pakistani',
      'Karachi Cuisine',
      'Biryani',
      'BBQ',
      'Fast Food',
      'Chinese',
      'Rolls',
    ],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Karachi',
      addressRegion: 'Sindh',
      postalCode: '75300',
      addressCountry: 'PK',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '24.8607',
      longitude: '67.0011',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
        opens: '18:30',
        closes: '03:00',
      },
    ],
    hasMap: 'https://maps.google.com/?q=Little+Karachi+Express+Karachi',
    hasMenu: `${BASE_URL}/`,
    acceptsReservations: 'True',
    // Online ordering action
    potentialAction: [
      {
        '@type': 'OrderAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${BASE_URL}/?action=order`,
          inLanguage: 'en',
          actionPlatform: [
            'http://schema.org/DesktopWebPlatform',
            'http://schema.org/MobileWebPlatform',
          ],
        },
        deliveryMethod: [
          'http://purl.org/goodrelations/v1#DeliveryModeOwnFleet',
          'http://purl.org/goodrelations/v1#DeliveryModePickUp',
        ],
      },
      {
        '@type': 'ReserveAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${BASE_URL}/`,
          inLanguage: 'en',
          actionPlatform: [
            'http://schema.org/DesktopWebPlatform',
            'http://schema.org/MobileWebPlatform',
          ],
        },
      },
    ],
    sameAs: [
      'https://www.facebook.com/littlekarachiexpress',
      'https://www.instagram.com/littlekarachiexpress',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+923331702706',
      contactType: 'customer service',
      areaServed: 'PK',
      availableLanguage: ['English', 'Urdu'],
    },
  };

  // WebSite schema with Sitelinks Searchbox
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${BASE_URL}/#website`,
    name: 'Little Karachi Express',
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  // BreadcrumbList for the root homepage
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
        name: 'Menu',
        item: `${BASE_URL}/`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}
