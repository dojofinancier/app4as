'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { Clock, User, DollarSign, ArrowLeft, Lock, ShoppingCart } from 'lucide-react'
import { getCurrentUser } from '@/lib/actions/auth'
import { PaymentIntentCheckoutForm } from '@/components/payment/payment-intent-checkout-form'
import Link from 'next/link'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CartItem {
  id: string
  courseId: string
  tutorId: string
  startDatetime: string
  durationMin: number
  unitPriceCad: number
  lineTotalCad: number
  course: {
    titleFr: string
    studentRateCad: number
  }
  tutor: {
    displayName: string
    hourlyBaseRateCad: number
  }
}

interface Cart {
  id: string
  items: CartItem[]
  coupon?: {
    code: string
    type: 'percentage' | 'fixed'
    value: number
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [cart, setCart] = useState<Cart | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)

  useEffect(() => {
    const initializeCheckout = async () => {
      try {
        // Get current user (can be null for guests)
        const user = await getCurrentUser()
        setCurrentUser(user)

        // Get cart data (works for both authenticated and guest users)
        const cartResponse = await fetch('/api/cart/get')
        if (!cartResponse.ok) {
          throw new Error('Failed to load cart')
        }

        const { cart: cartData } = await cartResponse.json()
        if (!cartData || cartData.items.length === 0) {
          router.push('/panier')
          return
        }

        setCart(cartData)

        // Create Payment Intent (now supports guest users)
        const paymentResponse = await fetch('/api/checkout/create-payment-intent', {
          method: 'POST',
        })

        if (!paymentResponse.ok) {
          throw new Error('Failed to create payment intent')
        }

        const { clientSecret: secret, paymentIntentId: piId } = await paymentResponse.json()
        setClientSecret(secret)
        setPaymentIntentId(piId)
      } catch (error) {
        console.error('Error initializing checkout:', error)
        router.push('/panier')
      } finally {
        setLoading(false)
      }
    }

    initializeCheckout()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!cart || !clientSecret) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Panier introuvable</p>
          <Link href="/panier" className="text-blue-600 hover:underline">
            Retour au panier
          </Link>
        </div>
      </div>
    )
  }

  const totalPrice = cart.items.reduce((sum, item) => {
    const lineTotal = typeof item.lineTotalCad === 'number' ? item.lineTotalCad : Number(item.lineTotalCad)
    return sum + lineTotal
  }, 0)
  const discount = cart.coupon ? 
    (cart.coupon.type === 'percentage' ? 
      totalPrice * (cart.coupon.value / 100) : 
      cart.coupon.value) : 0
  const finalTotal = totalPrice - discount

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/panier" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au panier
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Finaliser votre commande</h1>
          <p className="text-gray-600 mt-2">Vérifiez vos sessions et procédez au paiement</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Résumé de la commande ({cart.items.length} sessions)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cart.items.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{item.course.titleFr}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.tutor.displayName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(item.startDatetime).toLocaleDateString('fr-CA', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })} à {new Date(item.startDatetime).toLocaleTimeString('fr-CA', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.durationMin === 60 ? '1h' : 
                           item.durationMin === 90 ? '1h30' : '2h'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(typeof item.lineTotalCad === 'number' ? item.lineTotalCad : Number(item.lineTotalCad))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon */}
                {cart.coupon && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-900">
                          Rabais: {cart.coupon.code}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-green-900">
                        -{formatCurrency(discount)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sous-total:</span>
                    <span>{formatCurrency(totalPrice)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Rabais:</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">Total</span>
                    </div>
                    <span className="text-2xl font-bold">{formatCurrency(finalTotal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Paiement sécurisé
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <PaymentIntentCheckoutForm
                    cart={cart}
                    user={currentUser}
                    clientSecret={clientSecret}
                    onSuccess={(paymentIntentId) => {
                      router.push('/tableau-de-bord')
                    }}
                    onError={(error) => {
                      console.error('Payment error:', error)
                    }}
                  />
                </Elements>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}