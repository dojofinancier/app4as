import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { frCA } from '@/lib/i18n/fr-CA'
import { getCheckoutSession } from '@/lib/actions/checkout'
import { getCurrentUser } from '@/lib/actions/auth'

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string }
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/connexion')
  }

  const sessionId = searchParams.session_id

  if (!sessionId) {
    redirect('/panier')
  }

  const result = await getCheckoutSession(sessionId)

  if (!result.success) {
    redirect('/panier')
  }

  return (
    <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/20">
            <svg
              className="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl">{frCA.payment.success}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            {frCA.payment.successMessage}
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href="/tableau-de-bord">
              {frCA.payment.viewAppointments}
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/cours">{frCA.payment.backToCourses}</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}


