'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
// Signup webhook removed - signups only happen via guest checkout

export async function signUp(data: {
  email: string
  password: string
  firstName: string
  lastName: string
}) {
  const supabase = await createClient()

  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  if (!authData.user) {
    return { success: false, error: 'Échec de la création du compte' }
  }

    // Create user in database
    try {
      const user = await prisma.user.create({
        data: {
          id: authData.user.id,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role: 'student', // Default role
        },
      })

      // Note: Signup webhook removed - signups only happen via guest checkout
      // The signup webhook will fire when they complete their first booking

      return { success: true }
  } catch (error) {
    console.error('Error creating user:', error)
    return { success: false, error: 'Erreur lors de la création du profil' }
  }
}

export async function signIn(data: { email: string; password: string }) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signInWithOAuth(provider: 'google' | 'azure') {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider === 'azure' ? 'azure' : 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    return { success: false, error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }

  return { success: true }
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: {
      tutor: true,
    },
  })

  return user
}

export async function updateProfile(data: {
  firstName: string
  lastName: string
  phone?: string
}) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return { success: false, error: 'Non autorisé' }
  }

  try {
    await prisma.user.update({
      where: { id: authUser.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
      },
    })

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error) {
    console.error('Error updating profile:', error)
    return { success: false, error: 'Erreur lors de la mise à jour du profil' }
  }
}

export async function updateProfileInfo(data: {
  firstName: string
  lastName: string
  phone?: string
}) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return { success: false, error: 'Non autorisé' }
  }

  try {
    // Get current user data for logging
    const currentUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { firstName: true, lastName: true, phone: true }
    })

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
      },
    })

    // Log profile changes
    console.log('Profile updated:', {
      userId: authUser.id,
      changes: {
        firstName: { from: currentUser?.firstName, to: data.firstName },
        lastName: { from: currentUser?.lastName, to: data.lastName },
        phone: { from: currentUser?.phone, to: data.phone || null },
      },
      timestamp: new Date().toISOString()
    })

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error) {
    console.error('Error updating profile:', error)
    return { success: false, error: 'Erreur lors de la mise à jour du profil' }
  }
}

export async function changePassword(data: {
  newPassword: string
  confirmPassword: string
}) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return { success: false, error: 'Non autorisé' }
  }

  // Validate password confirmation
  if (data.newPassword !== data.confirmPassword) {
    return { success: false, error: 'Les mots de passe ne correspondent pas' }
  }

  // Validate password length
  if (data.newPassword.length < 6) {
    return { success: false, error: 'Le mot de passe doit contenir au moins 6 caractères' }
  }

  try {
    // Update password using Supabase Auth
    const { error } = await supabase.auth.updateUser({
      password: data.newPassword
    })

    if (error) {
      console.error('Error updating password:', error)
      return { success: false, error: 'Erreur lors de la mise à jour du mot de passe' }
    }

    // Log password change
    console.log('Password changed:', {
      userId: authUser.id,
      timestamp: new Date().toISOString()
    })

    return { success: true }
  } catch (error) {
    console.error('Error changing password:', error)
    return { success: false, error: 'Erreur lors de la mise à jour du mot de passe' }
  }
}


