'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function updateTutorProfile(data: {
  firstName: string
  lastName: string
  displayName: string
  bioFr: string
  phone?: string | null
}) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return { success: false, error: 'Non autorisé' }
  }

  try {
    // Validate input
    if (!data.firstName.trim() || !data.lastName.trim() || !data.displayName.trim()) {
      return { success: false, error: 'Tous les champs obligatoires doivent être remplis' }
    }

    // Update user information
    await prisma.user.update({
      where: { id: authUser.id },
      data: {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone?.trim() || null,
      }
    })

    // Update tutor profile
    await prisma.tutor.update({
      where: { id: authUser.id },
      data: {
        displayName: data.displayName.trim(),
        bioFr: data.bioFr.trim(),
      }
    })

    revalidatePath('/tuteur/tableau-de-bord')
    
    return { success: true }
  } catch (error) {
    console.error('Error updating tutor profile:', error)
    return { success: false, error: 'Une erreur est survenue lors de la mise à jour du profil' }
  }
}

export async function updateTutorPassword(data: {
  currentPassword: string
  newPassword: string
}) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return { success: false, error: 'Non autorisé' }
  }

  try {
    // Validate input
    if (!data.currentPassword || !data.newPassword) {
      return { success: false, error: 'Tous les champs sont obligatoires' }
    }

    if (data.newPassword.length < 6) {
      return { success: false, error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' }
    }

    // Update password using Supabase Auth
    const { error } = await supabase.auth.updateUser({
      password: data.newPassword
    })

    if (error) {
      console.error('Error updating password:', error)
      return { success: false, error: 'Erreur lors de la mise à jour du mot de passe' }
    }

    revalidatePath('/tuteur/tableau-de-bord')
    
    return { success: true }
  } catch (error) {
    console.error('Error updating password:', error)
    return { success: false, error: 'Une erreur est survenue lors de la mise à jour du mot de passe' }
  }
}
