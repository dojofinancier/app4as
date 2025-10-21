'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { removeFromCart, applyCoupon, removeCoupon } from '@/lib/actions/cart'
import { createCheckoutSession } from '@/lib/actions/checkout'
import { calculateOrderTotals } from '@/lib/pricing'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { frCA } from '@/lib/i18n/fr-CA'
import type { Cart, CartItem, Course, Tutor, Coupon } from '@prisma/client'

interface CartWithItems extends Cart {
  items: (CartItem & {
    course: Course
    tutor: Tutor
  })[]
  coupon: Coupon | null
}

interface CartViewProps {
  initialCart: CartWithItems
}

export function CartView({ initialCart }: CartViewProps) {
  const router = useRouter()
  const [cart, setCart] = useState(initialCart)
  const [couponCode, setCouponCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRemoveItem = async (itemId: string) => {
    const result = await removeFromCart(itemId)
    if (result.success) {
      router.refresh()
    } else {
      setError(result.error || 'Une erreur est survenue')
    }
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return

    const result = await applyCoupon(couponCode)
    if (result.success) {
      router.refresh()
      setCouponCode('')
    } else {
      setError(result.error || 'Code promo invalide')
    }
  }

  const handleRemoveCoupon = async () => {
    const result = await removeCoupon()
    if (result.success) {
      router.refresh()
    }
  }

  const handleCheckout = async () => {
    setIsLoading(true)
    setError(null)

    const result = await createCheckoutSession()

    if (result.success && result.url) {
      window.location.href = result.url
    } else {
      setError(result.error || 'Une erreur est survenue')
      setIsLoading(false)
    }
  }

  const totals = calculateOrderTotals(
    cart.items.map((item) => ({ price: item.unitPriceCad.toNumber() })),
    cart.coupon
      ? {
          type: cart.coupon.type,
          value: cart.coupon.value,
        }
      : undefined
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
                    {formatCurrency(item.unitPriceCad.toNumber())}
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
                      ? `${cart.coupon.value.toNumber()}% de rabais`
                      : `${formatCurrency(cart.coupon.value.toNumber())} de rabais`}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleRemoveCoupon}>
                  Retirer
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder={frCA.booking.couponCode}
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <Button onClick={handleApplyCoupon}>Appliquer</Button>
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


