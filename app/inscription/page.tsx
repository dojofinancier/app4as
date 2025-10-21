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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">
            {frCA.auth.createAccount}
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {frCA.auth.alreadyHaveAccount}{' '}
            <Link
              href="/connexion"
              className="font-medium text-primary hover:underline"
            >
              {frCA.auth.signIn}
            </Link>
          </p>
        </div>
        <SignUpForm />
      </div>
    </div>
  )
}


