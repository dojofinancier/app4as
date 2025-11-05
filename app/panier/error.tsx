'use client'

import { ErrorBoundary } from '@/components/error-boundary'

export default function CartError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorBoundary />
}

