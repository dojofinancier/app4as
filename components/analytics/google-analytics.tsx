'use client'

import Script from 'next/script'

interface GoogleAnalyticsProps {
  measurementId?: string
}

/**
 * Google Analytics Component
 * 
 * Adds Google Analytics 4 (GA4) tracking to the application.
 * Only loads if NEXT_PUBLIC_GA_MEASUREMENT_ID is set.
 * 
 * Usage:
 * - Set NEXT_PUBLIC_GA_MEASUREMENT_ID environment variable (e.g., G-XXXXXXXXXX)
 * - Component will automatically load on all pages
 * 
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/scripts
 */
export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  // Get measurement ID from props or environment variable
  const gaId = measurementId || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  // Don't render if no measurement ID is provided
  if (!gaId) {
    return null
  }

  return (
    <>
      {/* Google Analytics gtag.js */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  )
}

