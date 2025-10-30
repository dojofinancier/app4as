import { getCurrentUser } from '@/lib/actions/auth'
import { getOrCreateCartByIdentity } from '@/lib/actions/cart'
import { getOrCreateCartSessionId } from '@/lib/utils/session'
import { CartView } from '@/components/cart/cart-view'

export default async function CartPage() {
  const user = await getCurrentUser()
  const sessionId = user ? undefined : await getOrCreateCartSessionId()
  const cart = user
    ? await getOrCreateCartByIdentity({ userId: user.id })
    : await getOrCreateCartByIdentity({ sessionId })

  // Convert Decimal fields to numbers for Client Component compatibility
  const serializedCart = {
    ...cart,
    items: cart.items.map(item => ({
      ...item,
      unitPriceCad: Number(item.unitPriceCad),
      lineTotalCad: Number(item.lineTotalCad),
      course: {
        ...item.course,
        studentRateCad: Number(item.course.studentRateCad)
      },
      tutor: {
        ...item.tutor,
        hourlyBaseRateCad: Number(item.tutor.hourlyBaseRateCad)
      }
    })),
    coupon: cart.coupon ? {
      id: cart.coupon.id,
      code: cart.coupon.code,
      type: cart.coupon.type,
      value: Number(cart.coupon.value),
      active: cart.coupon.active,
      startsAt: cart.coupon.startsAt,
      endsAt: cart.coupon.endsAt,
      maxRedemptions: cart.coupon.maxRedemptions,
      redemptionCount: cart.coupon.redemptionCount
    } : null
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 text-4xl font-bold">Mon panier</h1>
      <CartView initialCart={serializedCart} sessionId={sessionId} />
    </div>
  )
}


