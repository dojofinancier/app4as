'use client'

import { useState, useEffect } from 'react'
import { ConversationsList } from './conversations-list'
import { ConversationView } from './conversation-view'
import { StartConversation } from './start-conversation'

interface MessagingTabProps {
  selectedTutorInfo?: any | null
}

export function MessagingTab({ selectedTutorInfo }: MessagingTabProps) {
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null)
  const [showStartConversation, setShowStartConversation] = useState(false)

  // Auto-select tutor if selectedTutorInfo is provided
  useEffect(() => {
    if (selectedTutorInfo && !selectedParticipant) {
      setSelectedParticipant(selectedTutorInfo)
    }
  }, [selectedTutorInfo])

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

  const handleSelectTutor = (tutor: any) => {
    setSelectedParticipant(tutor)
    setShowStartConversation(false)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Messages</h2>
          <p className="text-muted-foreground">
            Communiquez avec vos tuteurs
          </p>
        </div>
        <button
          onClick={handleStartNewConversation}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Nouvelle conversation
        </button>
      </div>

      <div className="h-[600px] border rounded-lg overflow-hidden">
        {showStartConversation ? (
          <div className="h-full p-4 overflow-y-auto">
            <StartConversation onSelectTutor={handleSelectTutor} />
          </div>
        ) : selectedParticipant ? (
          <ConversationView
            participant={selectedParticipant}
            onBack={handleBackToList}
          />
        ) : (
          <div className="h-full p-4">
            <ConversationsList onSelectConversation={handleSelectConversation} />
          </div>
        )}
      </div>
    </div>
  )
}
