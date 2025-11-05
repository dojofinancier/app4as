'use client'

import { ErrorBoundary } from '@/components/error-boundary'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error
    import('@/lib/utils/error-logging').then(({ logClientError }) => {
      logClientError(
        error.message || 'Une erreur est survenue',
        error.stack,
        {
          url: typeof window !== 'undefined' ? window.location.href : undefined,
          digest: error.digest,
        }
      )
    })
  }, [error])

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Une erreur est survenue</h1>
          <p className="text-muted-foreground mb-4">
            Désolé, une erreur inattendue s'est produite.
          </p>
          <button
            onClick={reset}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Réessayer
          </button>
        </div>
      </div>
    </ErrorBoundary>
  )
}

