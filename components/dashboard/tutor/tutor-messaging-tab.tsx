'use client'

import { useState, useEffect } from 'react'
import { ConversationsList } from '../../messaging/conversations-list'
import { ConversationView } from '../../messaging/conversation-view'
import { TutorStartConversation } from '../../messaging/tutor-start-conversation'

interface TutorMessagingTabProps {
  selectedStudentInfo?: any | null
}

export function TutorMessagingTab({ selectedStudentInfo }: TutorMessagingTabProps) {
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null)
  const [showStartConversation, setShowStartConversation] = useState(false)

  // Auto-select student if selectedStudentInfo is provided
  useEffect(() => {
    if (selectedStudentInfo && !selectedParticipant) {
      setSelectedParticipant(selectedStudentInfo)
    }
  }, [selectedStudentInfo])

  const handleSelectConversation = (participant: any) => {
    setSelectedParticipant(participant)
    setShowStartConversation(false)
  }

  const handleBackToList = () => {
    setSelectedParticipant(null)
    setShowStartConversation(false)
  }

  const handleStartNewConversation = () => {
    setShowStartConversation(true)
    setSelectedParticipant(null)
  }

  const handleSelectStudent = (student: any) => {
    setSelectedParticipant(student)
    setShowStartConversation(false)
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Messages</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Communiquez avec vos étudiants
          </p>
        </div>
        <button
          onClick={handleStartNewConversation}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors w-full sm:w-auto text-sm sm:text-base"
        >
          Nouvelle conversation
        </button>
      </div>

      {showStartConversation ? (
        <TutorStartConversation 
          onSelectStudent={handleSelectStudent}
          onBack={handleBackToList}
        />
      ) : selectedParticipant ? (
        <ConversationView 
          participant={selectedParticipant}
          onBack={handleBackToList}
        />
      ) : (
        <ConversationsList 
          onSelectConversation={handleSelectConversation}
        />
      )}
    </div>
  )
}
