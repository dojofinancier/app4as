'use client'

import { ErrorBoundary } from '@/components/error-boundary'

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorBoundary />
}

