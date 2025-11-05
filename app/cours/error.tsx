'use client'

import { ErrorBoundary } from '@/components/error-boundary'

export default function CoursesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorBoundary />
}

