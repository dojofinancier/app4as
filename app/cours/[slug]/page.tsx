import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function CourseDetailPage({
  params,
}: {
  params: { slug: string }
}) {
  const course = await prisma.course.findUnique({
    where: { slug: params.slug, active: true },
  })

  if (!course) {
    notFound()
  }

  // Redirect directly to reservation page (no auth required)
  redirect(`/cours/${course.slug}/reservation`)
}

