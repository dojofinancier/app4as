'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart } from 'lucide-react'

interface CartIconProps {
  initialCount?: number
}

export function CartIcon({ initialCount = 0 }: CartIconProps) {
  const [count, setCount] = useState(initialCount)

  // Fetch cart count from API
  const fetchCartCount = useCallback(async () => {
    try {
      const response = await fetch('/api/cart/get')
      if (response.ok) {
        const data = await response.json()
        const itemCount = data.cart?.items?.length || 0
        setCount(itemCount)
      }
    } catch (error) {
      console.error('Error fetching cart count:', error)
      // Keep current count on error
    }
  }, [])

  // Update count when initialCount prop changes (e.g., on page navigation)
  useEffect(() => {
    setCount(initialCount)
  }, [initialCount])

  // Fetch cart count on mount to ensure accuracy
  useEffect(() => {
    fetchCartCount()
  }, [fetchCartCount])

  // Listen for cart update events
  useEffect(() => {
    const handleCartUpdate = () => {
      fetchCartCount()
    }

    // Listen to custom event
    window.addEventListener('cartUpdated', handleCartUpdate)
    
    // Also listen to storage events (for cross-tab updates)
    window.addEventListener('storage', handleCartUpdate)

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate)
      window.removeEventListener('storage', handleCartUpdate)
    }
  }, [fetchCartCount])

  return (
    <Link href="/panier">
      <Button variant="ghost" size="sm" className="relative p-2">
        <ShoppingCart className="h-5 w-5" />
        {count > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold"
          >
            {count > 99 ? '99+' : count}
          </Badge>
        )}
      </Button>
    </Link>
  )
}

