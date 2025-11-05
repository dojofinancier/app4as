/**
 * Caching utilities using Next.js unstable_cache
 * 
 * TTL Recommendations:
 * - Course list: 1 hour (changes rarely)
 * - Tutor profiles: 30 minutes (may change)
 * - Availability rules: 5 minutes (changes more often)
 * - Active tutor-course assignments: 10 minutes (moderate change frequency)
 */

import { unstable_cache } from 'next/cache'

// Cache tags for invalidation
export const CACHE_TAGS = {
  COURSES: 'courses',
  COURSE: (id: string) => `course-${id}`,
  TUTORS: 'tutors',
  TUTOR: (id: string) => `tutor-${id}`,
  TUTOR_COURSES: 'tutor-courses',
  TUTOR_COURSE: (tutorId: string, courseId: string) => `tutor-course-${tutorId}-${courseId}`,
  AVAILABILITY: (tutorId: string) => `availability-${tutorId}`,
  AVAILABILITY_RULES: (tutorId: string) => `availability-rules-${tutorId}`,
} as const

/**
 * Create a cached function with specified TTL and tags
 */
export function createCachedFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    ttl: number // Time to live in seconds
    tags: string[]
    keyPrefix: string
  }
): T {
  return (async (...args: Parameters<T>) => {
    const cacheKey = `${options.keyPrefix}-${JSON.stringify(args)}`
    
    return unstable_cache(
      async () => fn(...args),
      [cacheKey],
      {
        revalidate: options.ttl,
        tags: options.tags,
      }
    )()
  }) as T
}

/**
 * Invalidate cache by tag
 * Use this in server actions after mutations
 */
export async function invalidateCache(tags: string[]) {
  // Note: revalidateTag is not available in all Next.js versions
  // For now, we'll rely on TTL expiration
  // In Next.js 15+, you can use: import { revalidateTag } from 'next/cache'
  
  // This is a placeholder - actual invalidation will happen via TTL
  // or you can use revalidatePath if needed
  console.log(`Cache invalidation requested for tags: ${tags.join(', ')}`)
}

/**
 * Cache configuration constants
 */
export const CACHE_TTL = {
  COURSES: 3600, // 1 hour
  TUTOR_PROFILES: 1800, // 30 minutes
  AVAILABILITY_RULES: 300, // 5 minutes
  TUTOR_COURSES: 600, // 10 minutes
} as const

