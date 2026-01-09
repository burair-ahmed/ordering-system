'use client'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, Suspense } from 'react'

function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const area = searchParams?.get('area')

  useEffect(() => {
    // 1. Reset Identity if Area Changes (Treat as new "User Journey")
    // Use localStorage to persist across tabs/restarts
    if (area) {
      const lastArea = localStorage.getItem('posthog_last_area_tcc');
      
      // If we have a stored area, and it's different from current -> RESET
      if (lastArea && lastArea !== area) {
        console.log('[PostHog] TCC Area changed from', lastArea, 'to', area, '- Resetting Session');
        posthog.reset();
      }
      
      // Update stored area
      localStorage.setItem('posthog_last_area_tcc', area);
    }

    // 2. Track page views
    if (pathname && posthog) {
      let url = window.origin + pathname
      if (searchParams?.toString()) {
        url = url + `?${searchParams.toString()}`
      }

      // Construct a readable Page Name
      let pageName = 'TCC - Unknown Page';
      if (pathname === '/') {
        pageName = 'TCC - Home';
      } else if (pathname.includes('/order')) {
        const areaName = searchParams?.get('area') || 'Default';
        pageName = `TCC - Menu (${areaName})`;
      } else if (pathname.includes('/checkout')) {
        pageName = 'TCC - Checkout';
      } else if (pathname.includes('/thank-you')) {
        pageName = 'TCC - Thank You';
      } else if (pathname.includes('/platter')) {
        pageName = 'TCC - Platters';
      }

      posthog.capture('$pageview', {
        '$current_url': url,
        'page_name': pageName,
        'brand': 'the-chai-company',
        'area_context': searchParams?.get('area') || 'N/A'
      })
    }
  }, [pathname, searchParams, area])

  return null
}

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
      if (typeof window !== 'undefined') {
        const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
        const host = process.env.NEXT_PUBLIC_POSTHOG_HOST
        
        posthog.init(key || '', {
          api_host: host || 'https://us.i.posthog.com',
          person_profiles: 'always',
          capture_pageview: false, 
          loaded: (ph) => {
            // Set global property for all subsequent events
            ph.register({
                brand: 'the-chai-company'
            })
          }
        })
      }
    }, [])

  return (
    <PostHogProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView /> 
      </Suspense>
      {children}
    </PostHogProvider>
  )
}
