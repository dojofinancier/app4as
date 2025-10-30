'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { clearAllAppState, clearAllAuthState, clearCartSession } from '@/lib/utils/clear-auth'
import { LogOut, Trash2, RefreshCw } from 'lucide-react'

/**
 * Testing component to clear authentication state
 * Remove this component after testing
 */
export function AuthClearer() {
  const [isClearing, setIsClearing] = useState(false)

  const handleClearAuth = async () => {
    setIsClearing(true)
    await clearAllAuthState()
    setIsClearing(false)
  }

  const handleClearCart = () => {
    clearCartSession()
  }

  const handleClearAll = async () => {
    setIsClearing(true)
    await clearAllAppState()
    // Page will reload automatically
  }

  return (
    <Card className="fixed top-4 right-4 z-50 w-80 bg-yellow-50 border-yellow-200">
      <CardHeader>
        <CardTitle className="text-sm text-yellow-800 flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Testing Tools
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          onClick={handleClearAuth}
          disabled={isClearing}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Clear Auth State
        </Button>
        
        <Button
          onClick={handleClearCart}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Cart Session
        </Button>
        
        <Button
          onClick={handleClearAll}
          disabled={isClearing}
          variant="destructive"
          size="sm"
          className="w-full"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Clear All & Reload
        </Button>
        
        <p className="text-xs text-yellow-700 mt-2">
          Use these buttons to test guest booking flow
        </p>
      </CardContent>
    </Card>
  )
}
