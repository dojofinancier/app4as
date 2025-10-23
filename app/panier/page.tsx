import { getCurrentUser } from '@/lib/actions/auth'
import { getOrCreateCartByIdentity } from '@/lib/actions/cart'
import { getOrCreateCartSessionId } from '@/lib/utils/session'
import { CartView } from '@/components/cart/cart-view'

export default async function CartPage() {
  const user = await getCurrentUser()
  const cart = user
    ? await getOrCreateCartByIdentity({ userId: user.id })
    : await getOrCreateCartByIdentity({ sessionId: getOrCreateCartSessionId() })

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 text-4xl font-bold">Mon panier</h1>
      <CartView initialCart={cart} />
    </div>
  )
}


