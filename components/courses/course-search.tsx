'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Course {
  id: string
  code: string
  titleFr: string
  institution?: string
  slug: string
}

interface CourseSearchProps {
  courses: Course[]
  onSearchChange: (searchTerm: string) => void
  onCourseSelect?: (course: Course | null) => void
  placeholder?: string
}

export function CourseSearch({
  courses,
  onSearchChange,
  onCourseSelect,
  placeholder = 'Rechercher un cours par code, titre ou institution...'
}: CourseSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter courses based on search term
  const filteredCourses = searchTerm.trim()
    ? courses.filter(course => {
        const term = searchTerm.toLowerCase()
        return (
          course.code.toLowerCase().includes(term) ||
          course.titleFr.toLowerCase().includes(term) ||
          (course.institution && course.institution.toLowerCase().includes(term))
        )
      }).slice(0, 8) // Limit to 8 suggestions
    : []

  // Handle input change
  const handleInputChange = (value: string) => {
    setSearchTerm(value)
    setSelectedIndex(-1)
    setShowSuggestions(true)
    onSearchChange(value)
  }

  // Handle suggestion selection
  const handleSelectCourse = (course: Course) => {
    setSearchTerm('')
    setShowSuggestions(false)
    setSelectedIndex(-1)
    if (onCourseSelect) {
      onCourseSelect(course)
    }
    // Navigate to course page
    window.location.href = `/cours/${course.slug}`
  }

  // Handle clear
  const handleClear = () => {
    setSearchTerm('')
    setShowSuggestions(false)
    setSelectedIndex(-1)
    onSearchChange('')
    inputRef.current?.focus()
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredCourses.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => 
        prev < filteredCourses.length - 1 ? prev + 1 : prev
      )
      setShowSuggestions(true)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && filteredCourses[selectedIndex]) {
        handleSelectCourse(filteredCourses[selectedIndex])
      } else if (filteredCourses.length === 1) {
        handleSelectCourse(filteredCourses[0])
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Highlight matching text
  const highlightText = (text: string, term: string) => {
    if (!term) return text
    
    // Escape special regex characters
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`(${escapedTerm})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-10 h-12 text-base"
        />
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Effacer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Autocomplete suggestions */}
      {showSuggestions && filteredCourses.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-popover border border-border rounded-md shadow-lg max-h-[400px] overflow-y-auto">
          {filteredCourses.map((course, index) => (
            <button
              key={course.id}
              onClick={() => handleSelectCourse(course)}
              className={cn(
                'w-full text-left px-4 py-3 hover:bg-accent hover:text-accent-foreground transition-colors',
                'border-b border-border last:border-b-0',
                selectedIndex === index && 'bg-accent text-accent-foreground'
              )}
            >
              <div className="flex flex-col gap-1">
                <div className="font-medium text-sm">
                  {highlightText(course.titleFr, searchTerm)}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono">{highlightText(course.code, searchTerm)}</span>
                  {course.institution && (
                    <>
                      <span>•</span>
                      <span>{highlightText(course.institution, searchTerm)}</span>
                    </>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

