import { redirect } from 'next/navigation'

/**
 * Redirect /cours to / (homepage) since courses page is now the homepage
 * This maintains backward compatibility for any existing links to /cours
 */
export default async function CoursesPage() {
  redirect('/')
}


