import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import { prisma } from '@/lib/prisma'
import { TutorDashboard } from '@/components/dashboard/tutor-dashboard'

export default async function TutorDashboardPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/connexion')
  }
  
  if (user.role !== 'tutor') {
    redirect('/tableau-de-bord')
  }
  
  // Get tutor profile
  const tutor = await prisma.tutor.findUnique({
    where: { id: user.id },
    include: { 
      user: true,
      tutorCourses: {
        include: {
          course: true,
        },
      },
    }
  })
  
  if (!tutor) {
    redirect('/tableau-de-bord')
  }

  // Get tutor appointments
  const tutorAppointments = await prisma.appointment.findMany({
    where: { tutorId: user.id },
    select: {
      id: true,
      userId: true,
      tutorId: true,
      courseId: true,
      startDatetime: true,
      endDatetime: true,
      status: true,
      meetingLink: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      course: {
        select: {
          id: true,
          titleFr: true,
          slug: true,
          descriptionFr: true,
          active: true,
          createdAt: true,
          studentRateCad: true,
        },
      },
      orderItem: {
        select: {
          unitPriceCad: true,
          lineTotalCad: true,
        },
      },
    },
    orderBy: { startDatetime: 'asc' },
  })
  
  // Serialize tutor profile for client components
  const serializedTutorProfile = {
    ...tutor,
    hourlyBaseRateCad: Number(tutor.hourlyBaseRateCad),
    tutorCourses: tutor.tutorCourses.map(tc => ({
      ...tc,
      course: {
        ...tc.course,
        studentRateCad: Number(tc.course.studentRateCad),
      }
    }))
  }

  // Serialize appointments for client components
  const serializedAppointments = tutorAppointments.map(apt => ({
    ...apt,
    createdAt: new Date(),
    updatedAt: new Date(),
    course: {
      ...apt.course,
      studentRateCad: Number(apt.course.studentRateCad),
    },
    orderItem: apt.orderItem ? {
      ...apt.orderItem,
      unitPriceCad: Number(apt.orderItem.unitPriceCad),
      lineTotalCad: Number(apt.orderItem.lineTotalCad),
    } : null
  }))
  
  return (
    <TutorDashboard 
      tutorId={tutor.id} 
      tutorName={tutor.displayName}
      tutorProfile={serializedTutorProfile}
      appointments={serializedAppointments}
    />
  )
}
