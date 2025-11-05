'use client'

import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useOffline } from '@/lib/hooks/use-offline'

/**
 * Offline indicator component
 * Shows a banner when user is offline
 */
export function OfflineIndicator() {
  const { isOffline } = useOffline()

  if (!isOffline) {
    return null
  }

  return (
    <Alert variant="destructive" className="fixed top-0 left-0 right-0 z-50 rounded-none border-x-0 border-t-0">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        Vous êtes hors ligne. Certaines fonctionnalités peuvent ne pas être disponibles.
      </AlertDescription>
    </Alert>
  )
}

