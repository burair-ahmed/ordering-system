'use client'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, Suspense } from 'react'
import { useReportWebVitals } from 'next/web-vitals'

function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const area = searchParams?.get('area')

  useEffect(() => {
    // 1. Track page views
    if (pathname && posthog) {
      let url = window.origin + pathname
      if (searchParams?.toString()) {
        url = url + `?${searchParams.toString()}`
      }
      posthog.capture('$pageview', {
        '$current_url': url,
      })
    }

    // 2. Reset Identity if Area Changes (Treat as new "User Journey")
    if (area) {
      const lastArea = sessionStorage.getItem('posthog_last_area');
      
      // If we have a stored area, and it's different from current -> RESET
      if (lastArea && lastArea !== area) {
        console.log('[PostHog] Area changed from', lastArea, 'to', area, '- Resetting Session');
        posthog.reset();
      }
      
      // Update stored area
      sessionStorage.setItem('posthog_last_area', area);
    }
  }, [pathname, searchParams, area])

  return null
}

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
      if (typeof window !== 'undefined') {
        const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
        const host = process.env.NEXT_PUBLIC_POSTHOG_HOST
        
        console.log('Initializing PostHog with:', { key: key ? 'Present' : 'Missing', host })

        posthog.init(key || '', {
          api_host: host || 'https://us.i.posthog.com',
          person_profiles: 'always', // Track anonymous users as separate profiles
          capture_pageview: false, 
          loaded: (ph) => {
            console.log('PostHog loaded successfully', ph)
            ph.debug() // Enable debug mode
            
            // Log the current Distinct ID for debugging
            console.log('Current PostHog Distinct ID:', ph.get_distinct_id());
          }
        })
      }
    }, [])

    // Developer Debug Tool for Resetting Session
    const handleReset = () => {
      posthog.reset();
      window.location.reload();
    };

    /* Optional: Show a tiny reset button in bottom-left only in DEV mode */
    /* Uncomment below if you want a visible button on screen */
    // if (process.env.NODE_ENV === 'development') {
    //   return (
    //     <PostHogProvider client={posthog}>
    //       <Suspense fallback={null}>
    //         <PostHogPageView /> 
    //       </Suspense>
    //       {children}
    //       <button 
    //         onClick={handleReset}
    //         style={{ position: 'fixed', bottom: 10, left: 10, zIndex: 9999, background: 'red', color: 'white', padding: '5px' }}
    //       >
    //         Reset Session
    //       </button>
    //     </PostHogProvider>
    //   )
    // }


  return (
    <PostHogProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView /> 
      </Suspense>
      {children}
    </PostHogProvider>
  )
}
