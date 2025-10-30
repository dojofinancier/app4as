import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  
  const course = await prisma.course.findUnique({
    where: { slug, active: true },
  })

  if (!course) {
    notFound()
  }

  // Redirect directly to reservation page (no auth required)
  redirect(`/cours/${course.slug}/reservation`)
}

