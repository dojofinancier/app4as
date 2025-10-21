import Link from 'next/link'
import { getCurrentUser } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { UserMenu } from './user-menu'
import { frCA } from '@/lib/i18n/fr-CA'

export async function Navbar() {
  const user = await getCurrentUser()

  return (
    <nav className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold">
            4AS
          </Link>

          <div className="hidden items-center gap-4 md:flex">
            <Link
              href="/cours"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {frCA.nav.courses}
            </Link>
            <Link
              href="/tuteurs"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {frCA.nav.tutors}
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/panier">
                <Button variant="ghost" size="sm">
                  Panier
                </Button>
              </Link>
              <Link href="/tableau-de-bord">
                <Button variant="ghost" size="sm">
                  {frCA.nav.dashboard}
                </Button>
              </Link>
              <UserMenu user={user} />
            </>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/connexion">{frCA.nav.login}</Link>
              </Button>
              <Button asChild>
                <Link href="/inscription">{frCA.nav.signup}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}


