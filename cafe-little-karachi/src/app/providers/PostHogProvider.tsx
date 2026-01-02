'use client'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, Suspense } from 'react'
import { useReportWebVitals } from 'next/web-vitals'

function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Track page views
    if (pathname && posthog) {
      let url = window.origin + pathname
      if (searchParams?.toString()) {
        url = url + `?${searchParams.toString()}`
      }
      posthog.capture('$pageview', {
        '$current_url': url,
      })
    }
  }, [pathname, searchParams])

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
