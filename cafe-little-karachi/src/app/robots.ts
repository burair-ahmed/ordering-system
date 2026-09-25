/**
 * src/app/robots.ts
 *
 * Next.js 15 App Router native robots.txt.
 * Served at /robots.txt.
 *
 * Policy:
 *  - Allow all primary customer-facing catalog routes
 *  - Block admin, checkout, API, private transactional routes
 *  - Allow static asset folders so crawlers can render pages correctly
 *  - AI crawler controls: allow search bots, block training scrapers
 */

import type { MetadataRoute } from 'next';

const BASE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://cafelittlekarachi.com'
).replace(/\/+$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ── Primary crawlers — full catalog access ────────────────────────────
      {
        userAgent: ['Googlebot', 'Bingbot', 'Slurp', 'DuckDuckBot', 'Baiduspider', 'YandexBot'],
        allow: ['/', '/item/', '/platter/', '/order', '/delivery/'],
        disallow: [
          '/admin',
          '/admin/',
          '/api/',
          '/checkout',
          '/thank-you',
          '/table-management-client',
        ],
      },
      // ── WhatsApp & Facebook link scrapers — allow OG meta resolution ──────
      {
        userAgent: ['WhatsApp', 'facebookexternalhit', 'Twitterbot', 'LinkedInBot', 'Slackbot'],
        allow: '/',
        disallow: ['/admin/', '/api/', '/checkout', '/thank-you'],
      },
      // ── AI Search Bots — allow for search/citation visibility ─────────────
      {
        userAgent: ['OAI-SearchBot', 'PerplexityBot', 'Claude-SearchBot', 'Claude-User'],
        allow: '/',
        disallow: ['/admin/', '/api/', '/checkout', '/thank-you'],
      },
      // ── AI Training Scrapers — block to protect original content ──────────
      {
        userAgent: ['GPTBot', 'ClaudeBot', 'CCBot', 'omgili', 'omgilibot', 'FacebookBot'],
        disallow: '/',
      },
      // ── Default wildcard rule ─────────────────────────────────────────────
      {
        userAgent: '*',
        allow: ['/', '/item/', '/platter/', '/order'],
        disallow: [
          '/admin',
          '/admin/',
          '/api/',
          '/checkout',
          '/thank-you',
          '/table-management-client',
          '/test-api-client',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    // Crawl-delay hint (respected by some bots, not Googlebot)
    // crawlDelay: 1,
  };
}
