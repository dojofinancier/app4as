'use client'

import { useState } from 'react'
import { signOut } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'

interface UserMenuProps {
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
    role: string
    stripeCustomerId: string | null
    defaultPaymentMethodId: string | null
    createdAt: Date
  }
}

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
          {user.firstName[0]}
          {user.lastName[0]}
        </div>
        <span className="hidden md:inline">
          {user.firstName} {user.lastName}
        </span>
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border bg-background p-2 shadow-lg">
            <div className="border-b px-2 pb-2">
              <p className="font-medium">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Rôle: {user.role}
              </p>
            </div>
            <div className="mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={handleSignOut}
              >
                Se déconnecter
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}


