import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import { SignUpForm } from '@/components/auth/sign-up-form'
import { frCA } from '@/lib/i18n/fr-CA'

export default async function SignUpPage() {
  const user = await getCurrentUser()

  if (user) {
    redirect('/tableau-de-bord')
  }

  // Redirect to login page - signups only happen via guest checkout
  redirect('/connexion')
}


