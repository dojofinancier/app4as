'use client'

import { ErrorBoundary } from '@/components/error-boundary'
import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Mail } from 'lucide-react'

export default function CheckoutError({
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
        error.message || 'Une erreur est survenue lors du checkout',
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
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <CardTitle>Erreur lors du paiement</CardTitle>
            </div>
            <CardDescription>
              Désolé, une erreur est survenue lors du processus de paiement.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>
                Si ce problème persiste, veuillez contacter notre équipe de support.
              </p>
            </div>

            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a
                href="mailto:support@carredastutorat.com"
                className="text-sm text-primary hover:underline"
              >
                support@carredastutorat.com
              </a>
            </div>

            <Button onClick={reset} className="w-full" variant="default">
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  )
}

