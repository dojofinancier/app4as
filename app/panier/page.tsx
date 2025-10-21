import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import { getOrCreateCart } from '@/lib/actions/cart'
import { CartView } from '@/components/cart/cart-view'

export default async function CartPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/connexion')
  }

  const cart = await getOrCreateCart(user.id)

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 text-4xl font-bold">Mon panier</h1>
      <CartView initialCart={cart} />
    </div>
  )
}


