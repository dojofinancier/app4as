'use client'

import { useState } from 'react'
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { CreditCard, MapPin, User, Mail, Phone, Save } from 'lucide-react'

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
  const [saveCard, setSaveCard] = useState(false)
  const [billingAddress, setBillingAddress] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    province: '',
    country: 'CA', // Use 2-character country code for Stripe
    password: '', // For guest users
    confirmPassword: '' // For guest users
  })

  const totalPrice = cart.items.reduce((sum, item) => {
    const lineTotal = typeof item.lineTotalCad === 'number' ? item.lineTotalCad : Number(item.lineTotalCad)
    return sum + lineTotal
  }, 0)
  const discount = cart.coupon ? 
    (cart.coupon.type === 'percentage' ? 
      totalPrice * (cart.coupon.value / 100) : 
      cart.coupon.value) : 0
  const finalTotal = totalPrice - discount

  // Password validation for guest users
  const isGuestUser = !user
  const passwordsMatch = billingAddress.password === billingAddress.confirmPassword
  const isPasswordValid = billingAddress.password.length >= 6

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
              name: `${billingAddress.firstName} ${billingAddress.lastName}`,
              email: billingAddress.email,
              phone: billingAddress.phone,
              address: {
                line1: billingAddress.address,
                city: billingAddress.city,
                state: billingAddress.province,
                country: billingAddress.country,
              },
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
                password: billingAddress.password,
                billingAddress: {
                  firstName: billingAddress.firstName,
                  lastName: billingAddress.lastName,
                  email: billingAddress.email,
                  phone: billingAddress.phone,
                  address: billingAddress.address,
                  city: billingAddress.city,
                  province: billingAddress.province,
                  country: billingAddress.country
                }
              })
            })

            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.error || 'Erreur lors de la création du compte')
            }

            // Account created and user signed in, redirect to dashboard
            window.location.href = '/tableau-de-bord'
            return
          } catch (error) {
            console.error('Error creating account:', error)
            onError(error instanceof Error ? error.message : 'Erreur lors de la création du compte')
            return
          }
        }
        
        // For existing users, just redirect
        onSuccess(paymentIntent.id)
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
              value={billingAddress.firstName}
              onChange={(e) => setBillingAddress(prev => ({ ...prev, firstName: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="lastName">Nom *</Label>
            <Input
              id="lastName"
              value={billingAddress.lastName}
              onChange={(e) => setBillingAddress(prev => ({ ...prev, lastName: e.target.value }))}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={billingAddress.email}
            onChange={(e) => setBillingAddress(prev => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>

        <div>
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            type="tel"
            value={billingAddress.phone}
            onChange={(e) => setBillingAddress(prev => ({ ...prev, phone: e.target.value }))}
          />
        </div>

        {/* Password fields for guest users */}
        {isGuestUser && (
          <>
            <div>
              <Label htmlFor="password">Mot de passe *</Label>
              <Input
                id="password"
                type="password"
                value={billingAddress.password}
                onChange={(e) => setBillingAddress(prev => ({ ...prev, password: e.target.value }))}
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
                value={billingAddress.confirmPassword}
                onChange={(e) => setBillingAddress(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
                minLength={6}
              />
              {billingAddress.confirmPassword && !passwordsMatch && (
                <p className="text-sm text-red-600 mt-1">
                  Les mots de passe ne correspondent pas
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Billing Address */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Adresse de facturation
        </h3>
        
        <div>
          <Label htmlFor="address">Adresse *</Label>
          <Input
            id="address"
            value={billingAddress.address}
            onChange={(e) => setBillingAddress(prev => ({ ...prev, address: e.target.value }))}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">Ville *</Label>
            <Input
              id="city"
              value={billingAddress.city}
              onChange={(e) => setBillingAddress(prev => ({ ...prev, city: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="province">Province *</Label>
            <Input
              id="province"
              value={billingAddress.province}
              onChange={(e) => setBillingAddress(prev => ({ ...prev, province: e.target.value }))}
              required
            />
          </div>
        </div>
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

        {/* Save Card Option */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="saveCard"
            checked={saveCard}
            onCheckedChange={(checked) => setSaveCard(checked as boolean)}
          />
          <Label htmlFor="saveCard" className="text-sm">
            Sauvegarder cette carte pour les prochains achats
          </Label>
        </div>
      </div>

      {/* Order Total */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
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
