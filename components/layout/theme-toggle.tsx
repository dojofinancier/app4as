'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from './theme-provider'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const themeRef = React.useRef(theme)

  // Keep ref in sync with theme
  React.useEffect(() => {
    themeRef.current = theme
  }, [theme])

  // Prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = React.useCallback(() => {
    // Always use the current theme value from ref to avoid stale closures
    const currentTheme = themeRef.current
    if (currentTheme === 'light') {
      setTheme('dark')
    } else if (currentTheme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }, [setTheme])

  const getIcon = React.useCallback(() => {
    if (!mounted) {
      return <Sun className="h-4 w-4" />
    }
    if (theme === 'light') return <Sun className="h-4 w-4" />
    if (theme === 'dark') return <Moon className="h-4 w-4" />
    // System theme - show based on current system preference
    if (typeof window !== 'undefined') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      return systemDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />
    }
    return <Sun className="h-4 w-4" />
  }, [theme, mounted])

  const getLabel = React.useCallback(() => {
    if (!mounted) return 'Basculer le thème'
    if (theme === 'light') return 'Basculer vers le mode sombre'
    if (theme === 'dark') return 'Basculer vers le mode système'
    return 'Basculer vers le mode clair'
  }, [theme, mounted])

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleTheme()
      }}
      className="h-9 w-9"
      aria-label={getLabel()}
      title={getLabel()}
    >
      {getIcon()}
      <span className="sr-only">{getLabel()}</span>
    </Button>
  )
}



