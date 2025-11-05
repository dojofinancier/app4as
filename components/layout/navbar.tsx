import Link from 'next/link'
import { getCurrentUser } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { UserMenu } from './user-menu'
import { NavbarClient } from './navbar-client'
import { Logo } from './logo'
import { CartIcon } from './cart-icon'
import { LayoutDashboard } from 'lucide-react'
import { frCA } from '@/lib/i18n/fr-CA'
import { getOrCreateCartByIdentity } from '@/lib/actions/cart'
import { getCartSessionId } from '@/lib/utils/session'

export async function Navbar() {
  const user = await getCurrentUser()

  // Serialize user object for client components
  const serializedUser = user ? {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    stripeCustomerId: user.stripeCustomerId,
    defaultPaymentMethodId: user.defaultPaymentMethodId,
    createdAt: user.createdAt,
  } : null

  // Get cart count for badge
  let cartCount = 0
  try {
    if (user && user.role === 'student') {
      const cart = await getOrCreateCartByIdentity({ userId: user.id })
      cartCount = cart.items.length
    } else if (!user) {
      // For guests, only check if session exists (don't create cart just for count)
      const sessionId = await getCartSessionId()
      if (sessionId) {
        const cart = await getOrCreateCartByIdentity({ sessionId })
        cartCount = cart.items.length
      }
      // If no session, count stays 0 (no cart created)
    }
  } catch (error) {
    console.error('Error fetching cart count:', error)
    // Fail silently, just show 0
  }

  return (
    <nav className="border-b overflow-hidden">
      <div className="container mx-auto flex h-16 items-center justify-between px-2 sm:px-4 max-w-full">
        <div className="flex items-center gap-2 sm:gap-8 min-w-0 flex-shrink">
          <Logo />
        </div>

        <div className="flex items-center gap-1 sm:gap-4 flex-shrink-0">
          <NavbarClient />
          {serializedUser ? (
            <>
              {serializedUser.role === 'student' && (
                <CartIcon initialCount={cartCount} />
              )}
              <Link href="/tableau-de-bord">
                <Button variant="ghost" size="sm" className="p-2 sm:px-3">
                  <LayoutDashboard className="h-5 w-5 sm:mr-2" />
                  <span className="hidden sm:inline">{frCA.nav.dashboard}</span>
                </Button>
              </Link>
              <UserMenu user={serializedUser} />
            </>
          ) : (
            <>
              <CartIcon initialCount={cartCount} />
              <Button asChild className="bg-primary hover:bg-accent text-xs sm:text-sm px-3 sm:px-4">
                <Link href="/connexion">{frCA.nav.login}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}


