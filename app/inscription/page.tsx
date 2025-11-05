import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'

export default async function SignUpPage() {
  const user = await getCurrentUser()

  if (user) {
    redirect('/tableau-de-bord')
  }

  // Redirect to login page - signups only happen via guest checkout
  redirect('/connexion')
}


