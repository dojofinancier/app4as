'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { updateProfileInfo } from '@/lib/actions/auth'
import type { User } from '@prisma/client'

const profileSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis').max(50, 'Le prénom ne peut pas dépasser 50 caractères'),
  lastName: z.string().min(1, 'Le nom est requis').max(50, 'Le nom ne peut pas dépasser 50 caractères'),
  phone: z.string().optional().refine((val) => {
    if (!val) return true
    // Basic phone validation for Canadian numbers
    const phoneRegex = /^(\+1|1)?[\s\-]?\(?[0-9]{3}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{4}$/
    return phoneRegex.test(val)
  }, 'Format de téléphone invalide')
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileInfoFormProps {
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
    role: string
    stripeCustomerId: string | null
    defaultPaymentMethodId: string | null
    createdAt: Date
  }
}

export function ProfileInfoForm({ user }: ProfileInfoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || ''
    }
  })

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true)
    setMessage(null)

    try {
      const result = await updateProfileInfo({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined
      })

      if (result.success) {
        setMessage({ type: 'success', text: 'Profil mis à jour avec succès' })
        reset(data) // Update form with new values
      } else {
        setMessage({ type: 'error', text: result.error || 'Erreur lors de la mise à jour' })
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: 'Une erreur inattendue est survenue' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations du profil</CardTitle>
        <CardDescription>
          Mettez à jour vos informations personnelles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                {...register('firstName')}
                placeholder="Votre prénom"
                disabled={isSubmitting}
              />
              {errors.firstName && (
                <p className="text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                {...register('lastName')}
                placeholder="Votre nom"
                disabled={isSubmitting}
              />
              {errors.lastName && (
                <p className="text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Courriel</Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="bg-gray-50"
            />
            <p className="text-sm text-gray-500">
              Le courriel ne peut pas être modifié
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone (optionnel)</Label>
            <Input
              id="phone"
              type="tel"
              {...register('phone')}
              placeholder="(514) 123-4567"
              disabled={isSubmitting}
            />
            {errors.phone && (
              <p className="text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          {message && (
            <div className={`p-3 rounded-md ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Mise à jour...' : 'Mettre à jour le profil'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
