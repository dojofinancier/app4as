'use client'

import { useState, useEffect } from 'react'

/**
 * Hook to detect offline/online state
 * 
 * Returns:
 * - isOffline: boolean indicating if user is offline
 * - wasOffline: boolean indicating if user was offline (for transition detection)
 */
export function useOffline(): {
  isOffline: boolean
  wasOffline: boolean
} {
  const [isOffline, setIsOffline] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    // Set initial state
    setIsOffline(!navigator.onLine)
    setWasOffline(!navigator.onLine)

    const handleOnline = () => {
      setWasOffline(isOffline)
      setIsOffline(false)
    }

    const handleOffline = () => {
      setWasOffline(isOffline)
      setIsOffline(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isOffline])

  return { isOffline, wasOffline }
}

