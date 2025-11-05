'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from './theme-provider'

export function Logo() {
  const { theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [isDark, setIsDark] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    
    // Determine if we should use dark theme
    const checkTheme = () => {
      if (theme === 'dark') {
        setIsDark(true)
      } else if (theme === 'light') {
        setIsDark(false)
      } else {
        // System theme - check system preference
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setIsDark(systemDark)
      }
    }
    
    checkTheme()
    
    // Listen for system theme changes when theme is 'system'
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => checkTheme()
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme])

  // Show a placeholder during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <Link href="/" className="flex items-center h-12">
        <div className="h-12 w-36 bg-muted animate-pulse rounded" />
      </Link>
    )
  }

  // Use dark_logo.png when theme is light, light_logo.png when theme is dark
  const logoSrc = isDark ? '/images/light_logo.png' : '/images/dark_logo.png'

  return (
    <Link href="/" className="flex items-center h-12 hover:opacity-80 transition-opacity flex-shrink-0">
      <Image
        src={logoSrc}
        alt="CARRÉ D'AS TUTORAT"
        width={180}
        height={48}
        className="h-auto w-auto max-h-10 sm:max-h-12 max-w-[140px] sm:max-w-[200px] object-contain"
        priority
      />
    </Link>
  )
}

