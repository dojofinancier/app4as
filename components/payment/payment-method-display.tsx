'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getPaymentMethod } from '@/lib/actions/payment-methods'
import { CreditCard, Plus, AlertCircle } from 'lucide-react'

interface PaymentMethodDisplayProps {
  onEdit: () => void
}

export function PaymentMethodDisplay({ onEdit }: PaymentMethodDisplayProps) {
  const [paymentMethod, setPaymentMethod] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPaymentMethod = async () => {
      try {
        const result = await getPaymentMethod()
        if (result.success) {
          setPaymentMethod(result.paymentMethod)
        } else {
          setError(result.error || 'Erreur lors du chargement')
        }
      } catch (error) {
        setError('Une erreur inattendue est survenue')
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentMethod()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Méthode de paiement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Chargement...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Méthode de paiement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Méthode de paiement
        </CardTitle>
      </CardHeader>
      <CardContent>
        {paymentMethod ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    •••• •••• •••• {paymentMethod.card.last4}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {paymentMethod.card.brand.toUpperCase()} • Expire {paymentMethod.card.exp_month}/{paymentMethod.card.exp_year}
                  </p>
                </div>
              </div>
              <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                Par défaut
              </div>
            </div>
            <Button onClick={onEdit} variant="outline" className="w-full">
              Modifier la carte
            </Button>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="text-muted-foreground">
              Aucune méthode de paiement enregistrée
            </div>
            <Button onClick={onEdit} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une carte
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
