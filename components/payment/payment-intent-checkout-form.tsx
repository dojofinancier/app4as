'use client'

import { useState } from 'react'
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { CreditCard, User } from 'lucide-react'

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
    type: 'percent' | 'fixed'
    value: number
  }
}

interface PaymentIntentCheckoutFormProps {
  cart: Cart
  user: any
  clientSecret: string
  onSuccess: (paymentIntentId: string) => void
  onError: (error: string) => void
}

export function PaymentIntentCheckoutForm({
  cart,
  user,
  clientSecret,
  onSuccess,
  onError
}: PaymentIntentCheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [billingInfo, setBillingInfo] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: '', // For guest users
    confirmPassword: '' // For guest users
  })

  const totalPrice = cart.items.reduce((sum, item) => {
    const lineTotal = typeof item.lineTotalCad === 'number' ? item.lineTotalCad : Number(item.lineTotalCad)
    return sum + lineTotal
  }, 0)
  const discount = cart.coupon ? 
    (cart.coupon.type === 'percent' ? 
      totalPrice * (cart.coupon.value / 100) : 
      cart.coupon.value) : 0
  const finalTotal = totalPrice - discount

  // Password validation for guest users
  const isGuestUser = !user
  const passwordsMatch = billingInfo.password === billingInfo.confirmPassword
  const isPasswordValid = billingInfo.password.length >= 6

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    // Validate password for guest users
    if (isGuestUser) {
      if (!isPasswordValid) {
        alert('Le mot de passe doit contenir au moins 6 caractères')
        return
      }
      if (!passwordsMatch) {
        alert('Les mots de passe ne correspondent pas')
        return
      }
    }

    setLoading(true)

    try {
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error('Card element not found')
      }

      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: `${billingInfo.firstName} ${billingInfo.lastName}`,
              email: billingInfo.email,
              phone: billingInfo.phone || undefined,
            },
          },
        }
      )

      if (error) {
        onError(error.message || 'Erreur de paiement')
      } else if (paymentIntent?.status === 'succeeded') {
        // For guest users, create account and sign in
        if (isGuestUser) {
          try {
            const response = await fetch('/api/checkout/confirm-payment-with-password', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                paymentIntentId: paymentIntent.id,
                password: billingInfo.password,
                billingInfo: {
                  firstName: billingInfo.firstName,
                  lastName: billingInfo.lastName,
                  email: billingInfo.email,
                  phone: billingInfo.phone,
                }
              })
            })

            if (!response.ok) {
              const errorData = await response.json()
              
              // Handle specific error for existing user
              if (errorData.code === 'USER_ALREADY_EXISTS') {
                onError(`Un compte existe déjà avec l'adresse email ${billingInfo.email}. Veuillez vous connecter avec votre compte existant.`)
                return
              }
              
              throw new Error(errorData.error || 'Erreur lors de la création du compte')
            }

            // Dispatch cart updated event to update cart counter
            window.dispatchEvent(new CustomEvent('cartUpdated'))
            
            // Account created and user signed in, redirect to dashboard
            window.location.href = '/tableau-de-bord'
            return
          } catch (error) {
            console.error('Error creating account:', error)
            onError(error instanceof Error ? error.message : 'Erreur lors de la création du compte')
            return
          }
        }
        
        // For existing users, confirm payment on server before redirecting
        try {
          const response = await fetch('/api/checkout/confirm-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentIntentId: paymentIntent.id,
            })
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Erreur lors de la confirmation du paiement')
          }

          const result = await response.json()
          console.log('Payment confirmed successfully:', result)
          
          // Dispatch cart updated event to update cart counter
          window.dispatchEvent(new CustomEvent('cartUpdated'))
          
          // Redirect to dashboard after successful confirmation
          onSuccess(paymentIntent.id)
        } catch (error) {
          console.error('Error confirming payment:', error)
          onError(error instanceof Error ? error.message : 'Erreur lors de la confirmation du paiement')
        }
      }
    } catch (error) {
      console.error('Payment error:', error)
      onError('Une erreur est survenue lors du paiement')
    } finally {
      setLoading(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: true, // Remove zip code as requested
    disableLink: true, // Disable autofill link as requested
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Billing Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <User className="h-5 w-5" />
          Informations de facturation
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">Prénom *</Label>
            <Input
              id="firstName"
              value={billingInfo.firstName}
              onChange={(e) => setBillingInfo(prev => ({ ...prev, firstName: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="lastName">Nom *</Label>
            <Input
              id="lastName"
              value={billingInfo.lastName}
              onChange={(e) => setBillingInfo(prev => ({ ...prev, lastName: e.target.value }))}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={billingInfo.email}
            onChange={(e) => setBillingInfo(prev => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>

        <div>
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            type="tel"
            value={billingInfo.phone}
            onChange={(e) => setBillingInfo(prev => ({ ...prev, phone: e.target.value }))}
          />
        </div>

        {/* Password fields for guest users */}
        {isGuestUser && (
          <>
            <div>
              <Label htmlFor="password">Choisissez un mot de passe *</Label>
              <Input
                id="password"
                type="password"
                value={billingInfo.password}
                onChange={(e) => setBillingInfo(prev => ({ ...prev, password: e.target.value }))}
                required
                minLength={6}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Minimum 6 caractères
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={billingInfo.confirmPassword}
                onChange={(e) => setBillingInfo(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
                minLength={6}
              />
              {billingInfo.confirmPassword && !passwordsMatch && (
                <p className="text-sm text-error mt-1">
                  Les mots de passe ne correspondent pas
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Payment Method */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Méthode de paiement
        </h3>
        
        <Card>
          <CardContent className="p-4">
            <CardElement options={cardElementOptions} />
          </CardContent>
        </Card>

      </div>

      {/* Order Total */}
      <div className="bg-muted p-4 rounded-lg space-y-2">
        <div className="flex justify-between text-sm">
          <span>Sous-total:</span>
          <span>{formatCurrency(totalPrice)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm text-success">
            <span>Rabais:</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
        )}
        <div className="flex justify-between font-medium pt-2 border-t">
          <span>Total:</span>
          <span>{formatCurrency(finalTotal)}</span>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!stripe || loading || (isGuestUser && (!isPasswordValid || !passwordsMatch))}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Traitement...
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            Payer {formatCurrency(finalTotal)}
          </>
        )}
      </Button>

      {/* Security Notice */}
      <div className="text-xs text-muted-foreground text-center">
        <p>🔒 Paiement sécurisé par Stripe</p>
        <p>Vos informations de paiement sont cryptées et sécurisées</p>
      </div>
    </form>
  )
}
