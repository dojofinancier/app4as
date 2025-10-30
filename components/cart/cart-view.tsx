'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { removeFromCart, applyCoupon, removeCoupon, applyCouponGuest, removeCouponGuest, getOrCreateCartByIdentity } from '@/lib/actions/cart'
import { calculateOrderPricing } from '@/lib/pricing'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { frCA } from '@/lib/i18n/fr-CA'
import { Loader2 } from 'lucide-react'
import type { Cart, CartItem, Course, Tutor, Coupon } from '@prisma/client'

// Serialized versions for client components
interface SerializedCartItem {
  id: string
  tutorId: string
  courseId: string
  startDatetime: Date
  durationMin: number
  cartId: string
  unitPriceCad: number
  lineTotalCad: number
  course: {
    id: string
    slug: string
    titleFr: string
    descriptionFr: string
    active: boolean
    createdAt: Date
    studentRateCad: number
  }
  tutor: {
    id: string
    displayName: string
    bioFr: string
    hourlyBaseRateCad: number
    priority: number
    active: boolean
  }
}

interface SerializedCart {
  id: string
  userId: string | null
  sessionId: string | null
  createdAt: Date
  updatedAt: Date
  items: SerializedCartItem[]
  coupon: {
    id: string
    code: string
    type: 'percent' | 'fixed'
    value: number
    active: boolean
    startsAt: Date | null
    endsAt: Date | null
    maxRedemptions: number | null
    redemptionCount: number
  } | null
}

interface CartWithItems extends Cart {
  items: (CartItem & {
    course: Course
    tutor: Tutor
  })[]
  coupon: Coupon | null
}

interface CartViewProps {
  initialCart: SerializedCart
  sessionId?: string
}

export function CartView({ initialCart, sessionId }: CartViewProps) {
  const router = useRouter()
  const [cart, setCart] = useState(initialCart)
  const [couponCode, setCouponCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCouponLoading, setIsCouponLoading] = useState(false)

  // Function to refresh cart data
  const refreshCart = async () => {
    try {
      const updatedCart = await getOrCreateCartByIdentity(
        sessionId ? { sessionId } : { userId: cart.userId || undefined }
      )
      
      // Convert Decimal fields to numbers for Client Component compatibility
      const serializedCart = {
        ...updatedCart,
        items: updatedCart.items.map(item => ({
          ...item,
          unitPriceCad: Number(item.unitPriceCad),
          lineTotalCad: Number(item.lineTotalCad),
          course: {
            ...item.course,
            studentRateCad: Number(item.course.studentRateCad)
          },
          tutor: {
            ...item.tutor,
            hourlyBaseRateCad: Number(item.tutor.hourlyBaseRateCad)
          }
        })),
        coupon: updatedCart.coupon ? {
          id: updatedCart.coupon.id,
          code: updatedCart.coupon.code,
          type: updatedCart.coupon.type,
          value: Number(updatedCart.coupon.value),
          active: updatedCart.coupon.active,
          startsAt: updatedCart.coupon.startsAt,
          endsAt: updatedCart.coupon.endsAt,
          maxRedemptions: updatedCart.coupon.maxRedemptions,
          redemptionCount: updatedCart.coupon.redemptionCount
        } : null
      }
      
      setCart(serializedCart)
    } catch (error) {
      console.error('Error refreshing cart:', error)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    const result = await removeFromCart(itemId, sessionId)
    if (result.success) {
      // Force a full page reload to ensure the cart is updated
      window.location.reload()
    } else {
      setError(result.error || 'Une erreur est survenue')
    }
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return

    setIsCouponLoading(true)
    setError(null)

    try {
      const result = sessionId 
        ? await applyCouponGuest(couponCode, sessionId)
        : await applyCoupon(couponCode)
        
      if (result.success) {
        setCouponCode('')
        await refreshCart() // Refresh cart data immediately
      } else {
        setError(result.error || 'Code promo invalide')
      }
    } catch (error) {
      setError('Une erreur est survenue')
    } finally {
      setIsCouponLoading(false)
    }
  }

  const handleRemoveCoupon = async () => {
    setIsCouponLoading(true)
    setError(null)

    try {
      const result = sessionId 
        ? await removeCouponGuest(sessionId)
        : await removeCoupon()
        
      if (result.success) {
        await refreshCart() // Refresh cart data immediately
      } else {
        setError(result.error || 'Erreur lors de la suppression du coupon')
      }
    } catch (error) {
      setError('Une erreur est survenue')
    } finally {
      setIsCouponLoading(false)
    }
  }

  const handleCheckout = async () => {
    setIsLoading(true)
    setError(null)

    // Redirect to checkout page
    router.push('/checkout')
  }

  const totals = calculateOrderPricing(
    cart.items.map((item) => ({
      courseId: item.courseId,
      tutorId: item.tutorId,
      durationMin: item.durationMin as 60 | 90 | 120,
      courseRate: item.course.studentRateCad,
      tutorRate: item.tutor.hourlyBaseRateCad,
    })),
    cart.coupon?.type,
    cart.coupon ? Number((cart.coupon as any).value) : undefined
  )

  if (cart.items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="mb-4 text-muted-foreground">{frCA.booking.cartEmpty}</p>
          <Button asChild>
            <a href="/cours">Parcourir les cours</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Articles ({cart.items.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between rounded-lg border p-4"
              >
                <div className="flex-1">
                  <h3 className="font-semibold">{item.course.titleFr}</h3>
                  <p className="text-sm text-muted-foreground">
                    Tuteur: {item.tutor.displayName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(item.startDatetime)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Durée: {item.durationMin} minutes
                  </p>
                  <p className="mt-2 font-semibold text-primary">
                    {formatCurrency(typeof item.unitPriceCad === 'number' ? item.unitPriceCad : Number((item.unitPriceCad as any)))}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveItem(item.id)}
                >
                  {frCA.booking.removeFromCart}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>{frCA.booking.applyCoupon}</CardTitle>
          </CardHeader>
          <CardContent>
            {cart.coupon ? (
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-semibold">{cart.coupon.code}</p>
                  <p className="text-sm text-muted-foreground">
                    {cart.coupon.type === 'percent'
                      ? `${Number(cart.coupon.value)}% de rabais`
                      : `${formatCurrency(Number(cart.coupon.value))} de rabais`}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRemoveCoupon}
                  disabled={isCouponLoading}
                >
                  {isCouponLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Retirer'
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder={frCA.booking.couponCode}
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <Button 
                  onClick={handleApplyCoupon}
                  disabled={isCouponLoading || !couponCode.trim()}
                >
                  {isCouponLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Appliquer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle>Résumé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-muted-foreground">{frCA.booking.subtotal}</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>

            {totals.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>{frCA.booking.discount}</span>
                <span>-{formatCurrency(totals.discount)}</span>
              </div>
            )}

            <div className="border-t pt-2">
              <div className="flex justify-between text-lg font-bold">
                <span>{frCA.booking.total}</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              size="lg"
              onClick={handleCheckout}
              disabled={isLoading}
            >
              {isLoading ? frCA.common.loading : frCA.booking.proceedToCheckout}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}


