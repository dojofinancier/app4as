'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { User, Lock, Save, Eye, EyeOff } from 'lucide-react'
import { updateTutorProfile, updateTutorPassword } from '@/lib/actions/tutor-profile'

interface TutorProfileTabProps {
  tutorProfile: {
    id: string
    displayName: string
    bioFr: string
    hourlyBaseRateCad: number
    priority: number
    active: boolean
    user: {
      id: string
      firstName: string
      lastName: string
      email: string
      phone: string | null
      role: string
    }
  }
}

export function TutorProfileTab({ tutorProfile }: TutorProfileTabProps) {
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isEditingPassword, setIsEditingPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: tutorProfile.user.firstName,
    lastName: tutorProfile.user.lastName,
    displayName: tutorProfile.displayName,
    bioFr: tutorProfile.bioFr,
    phone: tutorProfile.user.phone || '',
  })
  
  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await updateTutorProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        displayName: profileData.displayName,
        bioFr: profileData.bioFr,
        phone: profileData.phone || null,
      })

      if (result.success) {
        setSuccess('Profil mis à jour avec succès!')
        setIsEditingProfile(false)
      } else {
        setError(result.error || 'Erreur lors de la mise à jour du profil')
      }
    } catch (error) {
      setError('Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas')
      setIsLoading(false)
      return
    }

    if (passwordData.newPassword.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caractères')
      setIsLoading(false)
      return
    }

    try {
      const result = await updateTutorPassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })

      if (result.success) {
        setSuccess('Mot de passe mis à jour avec succès!')
        setIsEditingPassword(false)
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      } else {
        setError(result.error || 'Erreur lors de la mise à jour du mot de passe')
      }
    } catch (error) {
      setError('Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelProfile = () => {
    setProfileData({
      firstName: tutorProfile.user.firstName,
      lastName: tutorProfile.user.lastName,
      displayName: tutorProfile.displayName,
      bioFr: tutorProfile.bioFr,
      phone: tutorProfile.user.phone || '',
    })
    setIsEditingProfile(false)
    setError(null)
    setSuccess(null)
  }

  const handleCancelPassword = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    setIsEditingPassword(false)
    setError(null)
    setSuccess(null)
  }

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="p-4 bg-success-light border border-success-border rounded-lg">
          <p className="text-success text-sm">{success}</p>
        </div>
      )}
      
      {error && (
        <div className="p-4 bg-error-light border border-error-border rounded-lg">
          <p className="text-error text-sm">{error}</p>
        </div>
      )}

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
                Informations personnelles
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Gérez vos informations de profil et votre biographie
              </CardDescription>
            </div>
            {!isEditingProfile && (
              <Button
                variant="outline"
                onClick={() => setIsEditingProfile(true)}
                className="w-full sm:w-auto"
              >
                Modifier
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditingProfile ? (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom de famille</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="displayName">Nom d'affichage</Label>
                <Input
                  id="displayName"
                  value={profileData.displayName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="Nom affiché aux étudiants"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bioFr">Biographie</Label>
                <Textarea
                  id="bioFr"
                  value={profileData.bioFr}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bioFr: e.target.value }))}
                  placeholder="Décrivez votre expérience, vos spécialités et votre approche pédagogique..."
                  rows={4}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="submit" disabled={isLoading} className="flex-1 sm:flex-initial">
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancelProfile} className="flex-1 sm:flex-initial">
                  Annuler
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Prénom</Label>
                  <p className="text-sm">{tutorProfile.user.firstName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Nom de famille</Label>
                  <p className="text-sm">{tutorProfile.user.lastName}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Nom d'affichage</Label>
                <p className="text-sm">{tutorProfile.displayName}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                <p className="text-sm">{tutorProfile.user.email}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Téléphone</Label>
                <p className="text-sm">{tutorProfile.user.phone || 'Non renseigné'}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Biographie</Label>
                <p className="text-sm whitespace-pre-wrap">{tutorProfile.bioFr || 'Aucune biographie'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Management */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
                Mot de passe
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Modifiez votre mot de passe pour sécuriser votre compte
              </CardDescription>
            </div>
            {!isEditingPassword && (
              <Button
                variant="outline"
                onClick={() => setIsEditingPassword(true)}
                className="w-full sm:w-auto"
              >
                Modifier
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditingPassword ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => togglePasswordVisibility('current')}
                  >
                    {showPasswords.current ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => togglePasswordVisibility('new')}
                  >
                    {showPasswords.new ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => togglePasswordVisibility('confirm')}
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="submit" disabled={isLoading} className="flex-1 sm:flex-initial">
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancelPassword} className="flex-1 sm:flex-initial">
                  Annuler
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Mot de passe</Label>
              <p className="text-sm text-muted-foreground">••••••••</p>
              <p className="text-xs text-muted-foreground">
                Cliquez sur "Modifier" pour changer votre mot de passe
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du compte</CardTitle>
          <CardDescription>
            Informations sur votre compte tuteur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Tarif horaire de base</Label>
              <p className="text-sm">${tutorProfile.hourlyBaseRateCad.toFixed(2)} CAD</p>
            </div>
            
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Statut</Label>
              <p className="text-sm">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                  tutorProfile.active 
                    ? 'bg-success-light text-success dark:bg-success/20 dark:text-success'
                    : 'bg-error-light text-error dark:bg-error/20 dark:text-error'
                }`}>
                  {tutorProfile.active ? 'Actif' : 'Inactif'}
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
